'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react';

/**
 * Finger / stylus / mouse drawing surface.
 *
 * - Two stacked canvases: a background (paper lines + optional tracing guide)
 *   and the ink layer, so "Effacer" never wipes the lines.
 * - Strokes are kept in CSS pixels so undo and resize can redraw exactly.
 * - Palm rejection: once an Apple Pencil / stylus is seen, touches are ignored.
 */

export type Paper = 'seyes' | 'lignes' | 'blanc';

export type Stroke = {
  color: string;
  size: number;
  erase: boolean;
  points: { x: number; y: number; p: number }[];
};

export type DrawingCanvasHandle = {
  undo: () => void;
  clear: () => void;
  isEmpty: () => boolean;
  /**
   * PNG of paper + ink (or ink only on a white background when `inkOnly`).
   * `crop` keeps only the part that was written on (the whole width of the
   * paper is mostly empty for one word).
   */
  toDataURL: (opts?: { inkOnly?: boolean; crop?: boolean }) => string;
};

type Props = {
  ref?: Ref<DrawingCanvasHandle>;
  height: number;
  paper?: Paper;
  /** Size of the small Seyès interline in CSS px (letters are ~2 interlines tall). */
  lineGap?: number;
  color?: string;
  size?: number;
  eraser?: boolean;
  /** Dotted word drawn on the paper for the child to trace over. */
  guideText?: string;
  guideFont?: string;
  onChange?: (strokeCount: number) => void;
  className?: string;
};

function cssFontFamily(el: Element | null, varName: string, fallback: string): string {
  if (typeof window === 'undefined' || !el) return fallback;
  const v = getComputedStyle(el).getPropertyValue(varName).trim();
  return v || fallback;
}

export default function DrawingCanvas({
  ref,
  height,
  paper = 'seyes',
  lineGap = 12,
  color = '#1D3F9E',
  size = 6,
  eraser = false,
  guideText,
  guideFont = '--font-cursive',
  onChange,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const activePointer = useRef<number | null>(null);
  const sawPen = useRef(false);
  const widthRef = useRef(0);

  const drawBackground = useCallback(async () => {
    const c = bgRef.current;
    if (!c) return;
    const w = widthRef.current;
    const dpr = window.devicePixelRatio || 1;
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, height);
    g.fillStyle = '#FFFEFA';
    g.fillRect(0, 0, w, height);

    if (paper === 'seyes') {
      const gap = lineGap;
      const marginX = Math.min(70, w * 0.12);
      for (let i = 1, y = gap; y < height; i++, y += gap) {
        const main = i % 4 === 0;
        g.strokeStyle = main ? 'rgba(91, 31, 140, 0.55)' : 'rgba(110, 140, 220, 0.35)';
        g.lineWidth = main ? 1.2 : 0.8;
        g.beginPath();
        g.moveTo(0, y + 0.5);
        g.lineTo(w, y + 0.5);
        g.stroke();
      }
      // vertical guides every main square
      g.strokeStyle = 'rgba(110, 140, 220, 0.18)';
      g.lineWidth = 0.8;
      for (let x = marginX + gap * 4; x < w; x += gap * 4) {
        g.beginPath();
        g.moveTo(x + 0.5, 0);
        g.lineTo(x + 0.5, height);
        g.stroke();
      }
      g.strokeStyle = 'rgba(230, 57, 70, 0.7)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(marginX, 0);
      g.lineTo(marginX, height);
      g.stroke();
    } else if (paper === 'lignes') {
      const gap = lineGap * 4;
      for (let y = gap; y < height; y += gap) {
        g.strokeStyle = 'rgba(26,26,26,0.15)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(0, y + 0.5);
        g.lineTo(w, y + 0.5);
        g.stroke();
      }
    }

    if (guideText) {
      const family = cssFontFamily(wrapRef.current, guideFont, 'cursive');
      // Letters ~ 3 main interlines tall so small fingers can follow them.
      let px = Math.min(height * 0.55, 160);
      const fontFor = (p: number) => `400 ${p}px ${family}`;
      try {
        // Load only the real face: the generated "… Fallback" face uses local()
        // fonts that may not exist, which would make the whole load() reject.
        await document.fonts.load(`400 ${px}px ${family.split(',')[0]}`, guideText);
      } catch {
        /* font may be unavailable — canvas falls back */
      }
      // Fit the real ink box, not the font size: the school cursive reaches
      // ~1.45em above the baseline (l, h, k…) and ~0.9em below (g, p, y), so a
      // size picked from the height alone cut the top of the "l".
      const pad = Math.max(10, height * 0.05);
      const box = () => {
        const m = g.measureText(guideText);
        return { width: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
      };
      g.font = fontFor(px);
      let b = box();
      while ((b.width > w * 0.86 || b.asc + b.desc > height - pad * 2) && px > 20) {
        px -= 4;
        g.font = fontFor(px);
        b = box();
      }
      const x = (w - b.width) / 2;
      // Centre the ink vertically, then sit the baseline on the nearest Seyès
      // main line where the letters still fit (the lower one on a near tie).
      let y = (height - b.asc - b.desc) / 2 + b.asc;
      if (paper === 'seyes') {
        const main = lineGap * 4;
        const fits = (by: number) => by - b.asc >= pad && by + b.desc <= height - pad;
        const below = Math.ceil(y / main) * main;
        const above = Math.floor(y / main) * main;
        const score = (by: number) => Math.abs(by - y) - (by === below ? 8 : 0);
        const best = [below, above].filter(fits).sort((p, q) => score(p) - score(q))[0];
        if (best !== undefined) y = best;
      }
      g.fillStyle = 'rgba(244, 163, 64, 0.16)';
      g.fillText(guideText, x, y);
      g.setLineDash([3, 7]);
      g.lineCap = 'round';
      g.lineWidth = 2.5;
      g.strokeStyle = 'rgba(91, 31, 140, 0.45)';
      g.strokeText(guideText, x, y);
      g.setLineDash([]);
    }
  }, [height, paper, lineGap, guideText, guideFont]);

  const paintStroke = (g: CanvasRenderingContext2D, s: Stroke) => {
    const pts = s.points;
    if (pts.length === 0) return;
    g.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
    g.strokeStyle = s.color;
    g.fillStyle = s.color;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    if (pts.length === 1) {
      g.beginPath();
      g.arc(pts[0].x, pts[0].y, (s.size * (0.6 + pts[0].p * 0.6)) / 2, 0, Math.PI * 2);
      g.fill();
      return;
    }
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const prev = pts[i - 2] ?? a;
      g.lineWidth = s.size * (0.6 + ((a.p + b.p) / 2) * 0.6);
      g.beginPath();
      // smooth with midpoints
      g.moveTo((prev.x + a.x) / 2, (prev.y + a.y) / 2);
      g.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  };

  const redrawInk = useCallback(() => {
    const c = inkRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, widthRef.current, height);
    for (const s of strokes.current) paintStroke(g, s);
  }, [height]);

  // Size canvases to the container (and re-size on rotation).
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const resize = () => {
      const w = wrap.clientWidth;
      if (!w) return;
      widthRef.current = w;
      const dpr = window.devicePixelRatio || 1;
      for (const c of [bgRef.current, inkRef.current]) {
        if (!c) continue;
        c.width = Math.round(w * dpr);
        c.height = Math.round(height * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${height}px`;
      }
      void drawBackground();
      redrawInk();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [height, drawBackground, redrawInk]);

  const point = (e: React.PointerEvent) => {
    const r = inkRef.current!.getBoundingClientRect();
    // Mouse/finger report pressure 0 or 0.5 — treat both as "medium".
    const p = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5;
    return { x: e.clientX - r.left, y: e.clientY - r.top, p };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'pen') sawPen.current = true;
    if (e.pointerType === 'touch' && sawPen.current) return; // palm
    if (activePointer.current !== null) return;
    activePointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    current.current = { color, size: eraser ? size * 4 : size, erase: eraser, points: [point(e)] };
    const g = inkRef.current!.getContext('2d')!;
    paintStroke(g, current.current);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== e.pointerId || !current.current) return;
    const events = typeof e.nativeEvent.getCoalescedEvents === 'function' ? e.nativeEvent.getCoalescedEvents() : [];
    const pts = events.length ? events.map((ev) => point(ev as unknown as React.PointerEvent)) : [point(e)];
    const s = current.current;
    const g = inkRef.current!.getContext('2d')!;
    for (const p of pts) {
      s.points.push(p);
      // draw only the newest segment
      paintStroke(g, { ...s, points: s.points.slice(-3) });
    }
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== e.pointerId) return;
    activePointer.current = null;
    if (current.current) {
      strokes.current.push(current.current);
      current.current = null;
      onChange?.(strokes.current.length);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      undo: () => {
        strokes.current.pop();
        redrawInk();
        onChange?.(strokes.current.length);
      },
      clear: () => {
        strokes.current = [];
        redrawInk();
        onChange?.(0);
      },
      isEmpty: () => strokes.current.length === 0,
      toDataURL: ({ inkOnly, crop } = {}) => {
        const ink = inkRef.current!;
        const dpr = ink.width / Math.max(widthRef.current, 1);
        // Area to keep, in canvas pixels: everything, or the strokes plus a margin.
        let [x0, y0, x1, y1] = [0, 0, ink.width, ink.height];
        const drawn = strokes.current.filter((st) => !st.erase).flatMap((st) => st.points.map((pt) => ({ ...pt, r: st.size })));
        if (crop && drawn.length) {
          const m = 24;
          x0 = Math.max(0, Math.floor((Math.min(...drawn.map((pt) => pt.x - pt.r)) - m) * dpr));
          y0 = Math.max(0, Math.floor((Math.min(...drawn.map((pt) => pt.y - pt.r)) - m) * dpr));
          x1 = Math.min(ink.width, Math.ceil((Math.max(...drawn.map((pt) => pt.x + pt.r)) + m) * dpr));
          y1 = Math.min(ink.height, Math.ceil((Math.max(...drawn.map((pt) => pt.y + pt.r)) + m) * dpr));
        }
        const out = document.createElement('canvas');
        out.width = x1 - x0;
        out.height = y1 - y0;
        const g = out.getContext('2d')!;
        if (inkOnly) {
          g.fillStyle = '#FFFFFF';
          g.fillRect(0, 0, out.width, out.height);
        } else {
          g.drawImage(bgRef.current!, -x0, -y0);
        }
        g.drawImage(ink, -x0, -y0);
        return out.toDataURL('image/png');
      },
    }),
    [redrawInk, onChange],
  );

  return (
    <div ref={wrapRef} className={`relative w-full select-none ${className ?? ''}`} style={{ height }}>
      <canvas ref={bgRef} className="absolute inset-0 rounded-2xl" aria-hidden />
      <canvas
        ref={inkRef}
        className="absolute inset-0 rounded-2xl"
        style={{ touchAction: 'none', cursor: eraser ? 'cell' : 'crosshair' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onUp}
        aria-label="Zone d’écriture"
      />
    </div>
  );
}
