'use client';

import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import type { Decor, Movement } from '@/lib/creatures-store';

/**
 * A little animated world drawn on one <canvas>: a scenery plus one or more of
 * the child's drawings, each one "alive" — it breathes, sways (the drawing is
 * redrawn in thin slices that ripple, so it bends like jelly instead of moving
 * as a stiff sticker) and moves the way its creature should.
 *
 * Everything is on a single canvas so it can be recorded as a video to send to
 * the family (see `record`).
 */

export type StageActor = {
  id: string;
  sprite: string;
  mouvement: Movement;
  nom?: string;
};

export type LivingStageHandle = {
  /** Record the stage for `seconds` and resolve with a video file. */
  record: (seconds: number) => Promise<File | null>;
  /** Make an actor jump with a sparkle burst (as if tapped). */
  poke: (id: string) => void;
};

type Props = {
  ref?: Ref<LivingStageHandle>;
  actors: StageActor[];
  decor: Decor;
  onTapActor?: (id: string) => void;
  className?: string;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; char: string; size: number };

type ActorState = {
  img: HTMLImageElement | null;
  born: number;
  jump: number; // time of the last tap, -Infinity when none
  facing: number; // smoothed -1..1 (for turning around)
  box: { x: number; y: number; w: number; h: number };
  phase: number;
};

const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

function drawCloud(g: CanvasRenderingContext2D, x: number, y: number, s: number, alpha = 0.95) {
  g.fillStyle = `rgba(255,255,255,${alpha})`;
  // one path per puff, so no connecting line is drawn between them
  for (const [dx, dy, rx, ry] of [[0, 0, 46, 22], [-34, 6, 30, 18], [36, 6, 32, 17], [6, -16, 28, 20]]) {
    g.beginPath();
    g.ellipse(x + dx * s, y + dy * s, rx * s, ry * s, 0, 0, Math.PI * 2);
    g.fill();
  }
}

function drawScene(g: CanvasRenderingContext2D, decor: Decor, W: number, H: number, t: number) {
  const s = Math.max(0.6, W / 700);
  const wrap = (v: number, span: number) => ((v % span) + span) % span;

  if (decor === 'prairie') {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#7CC8F8');
    sky.addColorStop(0.7, '#DDF3FF');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    // sun with turning rays
    const sx = W * 0.85, sy = H * 0.17, r = 34 * s;
    g.save();
    g.translate(sx, sy);
    g.rotate(t * 0.3);
    g.strokeStyle = 'rgba(255,200,40,0.8)';
    g.lineWidth = 5 * s;
    g.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      g.rotate((Math.PI * 2) / 10);
      g.beginPath();
      g.moveTo(r * 1.35, 0);
      g.lineTo(r * 1.8, 0);
      g.stroke();
    }
    g.restore();
    g.fillStyle = '#FFD23F';
    g.beginPath();
    g.arc(sx, sy, r, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 3; i++) drawCloud(g, wrap(t * 12 * s + i * W * 0.45, W + 200) - 100, H * (0.12 + i * 0.08), s * (0.8 + i * 0.15));
    // hills
    g.fillStyle = '#8BD17C';
    g.beginPath();
    g.moveTo(0, H * 0.72);
    g.quadraticCurveTo(W * 0.25, H * 0.6, W * 0.55, H * 0.72);
    g.quadraticCurveTo(W * 0.8, H * 0.82, W, H * 0.68);
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.fill();
    g.fillStyle = '#5DB85A';
    g.fillRect(0, H * 0.8, W, H * 0.2);
    g.font = `${22 * s}px serif`;
    for (let i = 0; i < 9; i++) {
      const fx = ((i * 0.113 + 0.04) % 1) * W;
      g.save();
      g.translate(fx, H * (0.86 + (i % 3) * 0.04));
      g.rotate(Math.sin(t * 2 + i) * 0.12);
      g.fillText(i % 2 ? '🌼' : '🌷', -11 * s, 0);
      g.restore();
    }
  } else if (decor === 'ciel') {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5BB7F0');
    sky.addColorStop(1, '#FFD9EC');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    // rainbow
    const cols = ['#E63946', '#F4A340', '#FFD23F', '#2D9B6F', '#1D6FA4', '#5B1F8C'];
    g.lineWidth = 9 * s;
    cols.forEach((c, i) => {
      g.strokeStyle = c;
      g.globalAlpha = 0.45;
      g.beginPath();
      g.arc(W * 0.3, H * 1.05, H * 0.75 - i * 9 * s, Math.PI, Math.PI * 2);
      g.stroke();
    });
    g.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      drawCloud(g, wrap(t * (18 + i * 6) * s + i * W * 0.3, W + 240) - 120, H * (0.1 + (i % 4) * 0.2), s * (0.6 + (i % 3) * 0.25), 0.9);
    }
    for (let i = 0; i < 3; i++) drawCloud(g, (i + 0.3) * W * 0.4, H * 0.97, s * 1.8, 1);
  } else if (decor === 'mer') {
    const sea = g.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#5FD4E8');
    sea.addColorStop(1, '#0B4F6C');
    g.fillStyle = sea;
    g.fillRect(0, 0, W, H);
    // light rays
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 4; i++) {
      const x = W * (0.15 + i * 0.25) + Math.sin(t * 0.5 + i) * 20 * s;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 60 * s, 0);
      g.lineTo(x + 140 * s, H);
      g.lineTo(x + 40 * s, H);
      g.fill();
    }
    // sand
    g.fillStyle = '#F2D59B';
    g.beginPath();
    g.moveTo(0, H * 0.9);
    g.quadraticCurveTo(W * 0.5, H * 0.84, W, H * 0.9);
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.fill();
    // seaweed
    g.strokeStyle = '#2D9B6F';
    g.lineWidth = 7 * s;
    g.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const x = W * (0.06 + i * 0.15);
      g.beginPath();
      g.moveTo(x, H * 0.92);
      for (let k = 1; k <= 4; k++) {
        g.lineTo(x + Math.sin(t * 1.5 + i + k * 0.8) * 10 * s * k * 0.5, H * 0.92 - k * 22 * s * (1 + (i % 3) * 0.3));
      }
      g.stroke();
    }
    // bubbles
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const bx = ((i * 0.071 + 0.03) % 1) * W + Math.sin(t * 2 + i) * 6;
      const by = H - wrap(t * (30 + (i % 5) * 12) * s + i * 80, H + 40);
      g.beginPath();
      g.arc(bx, by, (3 + (i % 4) * 2) * s, 0, Math.PI * 2);
      g.stroke();
    }
  } else if (decor === 'espace') {
    const sp = g.createLinearGradient(0, 0, 0, H);
    sp.addColorStop(0, '#0B0B2B');
    sp.addColorStop(1, '#3B1A6B');
    g.fillStyle = sp;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const x = ((i * 0.6180339) % 1) * W;
      const y = ((i * 0.3819660 * 7) % 1) * H * 0.85;
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i));
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.beginPath();
      g.arc(x, y, (i % 5 === 0 ? 2.2 : 1.2) * s, 0, Math.PI * 2);
      g.fill();
    }
    g.font = `${70 * s}px serif`;
    g.fillText('🪐', W * 0.72, H * 0.3);
    g.font = `${40 * s}px serif`;
    g.fillText('🌙', W * 0.12, H * 0.2);
    g.save();
    g.translate(wrap(t * 60 * s, W + 400) - 200, H * 0.15 + Math.sin(t) * 10);
    g.font = `${28 * s}px serif`;
    g.fillText('☄️', 0, 0);
    g.restore();
    // little moon ground
    g.fillStyle = '#BFB6D9';
    g.beginPath();
    g.ellipse(W / 2, H * 1.25, W * 0.8, H * 0.45, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(120,100,170,0.4)';
    [[0.2, 0.9, 18], [0.55, 0.87, 12], [0.8, 0.93, 22]].forEach(([x, y, r]) => {
      g.beginPath();
      g.ellipse(W * x, H * y, r * s * 1.6, r * s * 0.6, 0, 0, Math.PI * 2);
      g.fill();
    });
  } else {
    // savane au coucher du soleil, avec un baobab
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#FF9A5A');
    sky.addColorStop(0.6, '#FFD27A');
    sky.addColorStop(1, '#FDE9B5');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,240,180,0.9)';
    g.beginPath();
    g.arc(W * 0.62, H * 0.58, 70 * s, 0, Math.PI * 2);
    g.fill();
    // baobab
    const bx = W * 0.18, by = H * 0.8;
    g.fillStyle = '#5A3A22';
    g.beginPath();
    g.moveTo(bx - 26 * s, by);
    g.quadraticCurveTo(bx - 20 * s, by - 90 * s, bx - 12 * s, by - 140 * s);
    g.lineTo(bx + 12 * s, by - 140 * s);
    g.quadraticCurveTo(bx + 20 * s, by - 90 * s, bx + 26 * s, by);
    g.fill();
    g.strokeStyle = '#5A3A22';
    g.lineWidth = 7 * s;
    g.lineCap = 'round';
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(bx, by - 135 * s);
      g.lineTo(bx + i * 22 * s, by - (165 + Math.abs(i) * -4) * s);
      g.stroke();
    }
    g.fillStyle = '#3F6B35';
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.ellipse(bx + i * 24 * s, by - (172 - Math.abs(i) * 3) * s, 20 * s, 11 * s, 0, 0, Math.PI * 2);
      g.fill();
    }
    // grass
    g.fillStyle = '#D9A441';
    g.fillRect(0, H * 0.8, W, H * 0.2);
    g.strokeStyle = '#B9822A';
    g.lineWidth = 2.5 * s;
    for (let i = 0; i < 40; i++) {
      const x = (i / 40) * W + 6;
      const sway = Math.sin(t * 2 + i * 0.7) * 4 * s;
      g.beginPath();
      g.moveTo(x, H * 0.82);
      g.quadraticCurveTo(x + sway, H * 0.79, x + sway * 1.6, H * 0.76);
      g.stroke();
    }
    // birds
    g.strokeStyle = 'rgba(60,40,30,0.7)';
    g.lineWidth = 2 * s;
    for (let i = 0; i < 3; i++) {
      const x = wrap(t * 25 * s + i * 60 * s, W + 200) - 100;
      const y = H * 0.22 + i * 14 * s;
      const f = Math.sin(t * 8 + i) * 5 * s;
      g.beginPath();
      g.moveTo(x - 10 * s, y + f);
      g.quadraticCurveTo(x - 4 * s, y - 2 * s, x, y);
      g.quadraticCurveTo(x + 4 * s, y - 2 * s, x + 10 * s, y + f);
      g.stroke();
    }
  }
}

export default function LivingStage({ ref, actors, decor, onTapActor, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const states = useRef<Map<string, ActorState>>(new Map());
  const particles = useRef<Particle[]>([]);
  const actorsRef = useRef(actors);
  const decorRef = useRef(decor);
  const clock = useRef(0);
  useEffect(() => {
    actorsRef.current = actors;
    decorRef.current = decor;
  }, [actors, decor]);

  const burst = (x: number, y: number, n = 14, chars = ['✨', '⭐', '💖']) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 80 + Math.random() * 160;
      particles.current.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0, max: 0.9 + Math.random() * 0.6,
        char: chars[i % chars.length], size: 14 + Math.random() * 14,
      });
    }
  };

  // Load sprites as actors come and go.
  useEffect(() => {
    const live = new Set(actors.map((a) => a.id));
    for (const id of Array.from(states.current.keys())) if (!live.has(id)) states.current.delete(id);
    actors.forEach((a, i) => {
      if (states.current.has(a.id)) return;
      const st: ActorState = {
        img: null, born: Infinity, jump: -Infinity, facing: 1,
        box: { x: 0, y: 0, w: 0, h: 0 }, phase: i * 1.7 + Math.random(),
      };
      states.current.set(a.id, st);
      const img = new Image();
      img.onload = () => {
        st.img = img;
        st.born = clock.current;
      };
      img.src = a.sprite;
    });
  }, [actors]);

  // Animation loop.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const g = canvas.getContext('2d')!;
    let W = 0, H = 0, raf = 0, last = performance.now();
    const fit = () => {
      W = wrap.clientWidth;
      H = Math.round(Math.min(W * 0.72, window.innerHeight * 0.62));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = `${H}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock.current += dt;
      const t = clock.current;
      g.clearRect(0, 0, W, H);
      drawScene(g, decorRef.current, W, H, t);

      const list = actorsRef.current;
      const n = list.length;
      const ground = H * (decorRef.current === 'mer' ? 0.9 : decorRef.current === 'espace' ? 0.88 : 0.86);

      list.forEach((a, idx) => {
        const st = states.current.get(a.id);
        if (!st?.img) return;
        const img = st.img;
        const age = t - st.born;
        if (age < 0) return;
        if (age < dt * 1.5) burst(W / 2, H / 2, 22);
        const ph = st.phase;
        // size: a crowd shrinks a bit
        const maxH = H * (n > 1 ? 0.36 : 0.48);
        const maxW = W * (n > 1 ? 0.28 : 0.42);
        const k = Math.min(maxH / img.height, maxW / img.width);
        const w = img.width * k;
        const h = img.height * k;
        const lane = n > 1 ? (idx + 0.5) / n : 0.5;
        const home = W * lane;
        const span = n > 1 ? W / n / 2 : W * 0.3;

        let x = home, y = ground, rot = 0, sx = 1, sy = 1, dir = 1, wave = 0.035, slicesV = false;
        switch (a.mouvement) {
          case 'sauter': {
            const hop = Math.abs(Math.sin(t * 2.6 + ph));
            y = ground - hop * H * 0.22;
            if (hop < 0.2) {
              sy = 0.82 + hop * 0.9;
              sx = 1.12 - hop * 0.6;
            }
            x = home + Math.sin(t * 0.4 + ph) * span * 0.4;
            break;
          }
          case 'voler': {
            const vx = Math.cos(t * 0.45 + ph);
            x = home + Math.sin(t * 0.45 + ph) * span;
            y = H * 0.42 + Math.sin(t * 1.8 + ph) * H * 0.08 + h / 2;
            rot = vx * 0.12 + Math.sin(t * 1.8 + ph) * 0.05;
            dir = vx >= 0 ? 1 : -1;
            wave = 0.06;
            break;
          }
          case 'nager': {
            const vx = Math.cos(t * 0.4 + ph);
            x = home + Math.sin(t * 0.4 + ph) * span;
            y = H * 0.55 + Math.sin(t * 1.3 + ph) * H * 0.05 + h / 2;
            rot = Math.sin(t * 1.3 + ph) * 0.08;
            dir = vx >= 0 ? 1 : -1;
            slicesV = true;
            break;
          }
          case 'danser': {
            x = home + Math.sin(t * 1.3 + ph) * span * 0.25;
            y = ground - Math.abs(Math.sin(t * 4 + ph)) * H * 0.04;
            rot = Math.sin(t * 4 + ph) * 0.2;
            wave = 0.06;
            break;
          }
          case 'marcher': {
            const period = 14;
            const p = ((t + ph * 3) % period) / period; // 0..1 there and back
            const there = p < 0.5;
            const u = there ? p * 2 : 2 - p * 2;
            x = home - span + u * span * 2;
            dir = there ? 1 : -1;
            y = ground - Math.abs(Math.sin(t * 6 + ph)) * H * 0.03;
            rot = Math.sin(t * 6 + ph) * 0.07;
            break;
          }
        }

        // tap → happy jump
        const j = t - st.jump;
        if (j < 0.7) {
          y -= Math.sin((j / 0.7) * Math.PI) * H * 0.18;
          rot += Math.sin((j / 0.7) * Math.PI * 2) * 0.15;
        }

        // smooth turning around
        st.facing += (dir - st.facing) * Math.min(1, dt * 6);
        // appear with a springy pop
        const pop = age < 0.9 ? easeOutBack(age / 0.9) : 1;
        const breathe = 1 + Math.sin(t * 2.2 + ph) * 0.025;

        // shadow
        const lift = Math.max(0, ground - y);
        g.fillStyle = `rgba(0,0,0,${0.18 * Math.max(0.2, 1 - lift / (H * 0.4))})`;
        g.beginPath();
        g.ellipse(x, ground + 4, (w / 2.4) * Math.max(0.4, 1 - lift / (H * 0.6)) * pop, 8 * pop, 0, 0, Math.PI * 2);
        g.fill();

        g.save();
        g.translate(x, y);
        g.rotate(rot);
        g.scale(sx * st.facing * pop, sy * breathe * pop);
        // draw in slices so the drawing ripples like it is alive
        if (slicesV) {
          const N = 28;
          const sw = img.width / N;
          for (let i = 0; i < N; i++) {
            const off = Math.sin(t * 5 + i * 0.45 + ph) * h * 0.035;
            g.drawImage(img, i * sw, 0, sw + 1, img.height, -w / 2 + (i * w) / N, -h + off, w / N + 1, h);
          }
        } else {
          const N = 28;
          const sh = img.height / N;
          for (let i = 0; i < N; i++) {
            const fromBottom = 1 - i / N; // feet stay put, head sways
            const off = Math.sin(t * 3 + i * 0.22 + ph) * w * wave * fromBottom;
            g.drawImage(img, 0, i * sh, img.width, sh + 1, -w / 2 + off, -h + (i * h) / N, w, h / N + 1);
          }
        }
        g.restore();
        st.box = { x: x - w / 2, y: y - h, w, h };
      });

      // particles
      particles.current = particles.current.filter((p) => p.life < p.max);
      for (const p of particles.current) {
        p.life += dt;
        p.vy += 220 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        g.globalAlpha = Math.max(0, 1 - p.life / p.max);
        g.font = `${p.size}px serif`;
        g.fillText(p.char, p.x, p.y);
      }
      g.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const poke = (id: string) => {
    const st = states.current.get(id);
    if (!st) return;
    st.jump = clock.current;
    burst(st.box.x + st.box.w / 2, st.box.y + st.box.h * 0.3, 10, ['💖', '✨', '🎵']);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    // topmost first
    const hit = [...actorsRef.current].reverse().find((a) => {
      const b = states.current.get(a.id)?.box;
      return b && px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
    });
    if (hit) {
      poke(hit.id);
      onTapActor?.(hit.id);
    } else {
      burst(px, py, 6, ['✨', '⭐']);
    }
  };

  useImperativeHandle(ref, () => ({
    poke,
    record: async (seconds: number) => {
      const canvas = canvasRef.current;
      if (!canvas || typeof MediaRecorder === 'undefined' || !canvas.captureStream) return null;
      const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
      const mimeType = types.find((m) => MediaRecorder.isTypeSupported(m));
      const stream = canvas.captureStream(30);
      const rec = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 4_000_000 } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      const done = new Promise<void>((res) => (rec.onstop = () => res()));
      rec.start(250);
      await new Promise((res) => setTimeout(res, seconds * 1000));
      rec.stop();
      await done;
      stream.getTracks().forEach((tr) => tr.stop());
      const type = rec.mimeType || mimeType || 'video/webm';
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      return new File(chunks, `mon-dessin-vivant.${ext}`, { type });
    },
  }));

  return (
    <div ref={wrapRef} className={`w-full overflow-hidden rounded-3xl shadow-lg ${className ?? ''}`}>
      <canvas ref={canvasRef} className="block w-full" style={{ touchAction: 'manipulation' }} onPointerDown={onPointerDown} />
    </div>
  );
}
