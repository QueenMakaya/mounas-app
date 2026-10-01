'use client';

/**
 * Turn a photo (or in-app drawing) of a child's artwork into a cut-out sprite:
 * the paper becomes transparent, the colours are white-balanced, and the
 * result is cropped to the drawing.
 *
 * Photos of paper are never evenly lit, so instead of a single "paper colour"
 * we estimate the paper colour *locally*: the brightest value of each channel
 * over a grid of blocks, smoothly interpolated. Anything clearly darker or more
 * colourful than the local paper is ink.
 */

export type Cutout = {
  /** Transparent PNG of the drawing only. */
  sprite: string;
  /** Opaque, cropped PNG of the original (for "garder le fond"). */
  framed: string;
  /** Small JPEG (base64, no prefix) to send to the storyteller. */
  jpegForAI: string;
  width: number;
  height: number;
};

const MAX_SIDE = 900;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function canvasOf(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export async function makeCutout(src: string): Promise<Cutout> {
  const img = await loadImage(src);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const base = canvasOf(w, h);
  const bg = base.getContext('2d', { willReadFrequently: true })!;
  bg.fillStyle = '#FFFFFF'; // transparent PNGs → white paper
  bg.fillRect(0, 0, w, h);
  bg.drawImage(img, 0, 0, w, h);
  const src0 = bg.getImageData(0, 0, w, h);
  const d = src0.data;

  // 1. Local paper colour: per-block max of each channel.
  const B = Math.max(16, Math.round(Math.max(w, h) / 24));
  const gw = Math.ceil(w / B);
  const gh = Math.ceil(h / B);
  const grid = new Float32Array(gw * gh * 3);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      // use a high percentile rather than the max to ignore glare specks
      const vals: number[][] = [[], [], []];
      for (let y = gy * B; y < Math.min(h, (gy + 1) * B); y += 2) {
        for (let x = gx * B; x < Math.min(w, (gx + 1) * B); x += 2) {
          const i = (y * w + x) * 4;
          vals[0].push(d[i]);
          vals[1].push(d[i + 1]);
          vals[2].push(d[i + 2]);
        }
      }
      for (let c = 0; c < 3; c++) {
        const v = vals[c].sort((a, b) => a - b);
        grid[(gy * gw + gx) * 3 + c] = v[Math.floor(v.length * 0.9)] ?? 255;
      }
    }
  }
  // A block that is entirely ink (big coloured area) would look like dark
  // "paper": take the max over each 3×3 neighbourhood to fill those holes.
  const grid2 = new Float32Array(grid.length);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      for (let c = 0; c < 3; c++) {
        let m = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const x = Math.min(gw - 1, Math.max(0, gx + dx));
            const y = Math.min(gh - 1, Math.max(0, gy + dy));
            m = Math.max(m, grid[(y * gw + x) * 3 + c]);
          }
        }
        grid2[(gy * gw + gx) * 3 + c] = m;
      }
    }
  }
  const paperAt = (x: number, y: number, c: number) => {
    const fx = Math.min(gw - 1, Math.max(0, x / B - 0.5));
    const fy = Math.min(gh - 1, Math.max(0, y / B - 0.5));
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(gw - 1, x0 + 1);
    const y1 = Math.min(gh - 1, y0 + 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const g = (xx: number, yy: number) => grid2[(yy * gw + xx) * 3 + c];
    return (g(x0, y0) * (1 - tx) + g(x1, y0) * tx) * (1 - ty) + (g(x0, y1) * (1 - tx) + g(x1, y1) * tx) * ty;
  };

  // 2. Alpha from "darker or more colourful than the paper", white-balanced colour.
  const out = new ImageData(w, h);
  const o = out.data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const pr = Math.max(40, paperAt(x, y, 0));
      const pg = Math.max(40, paperAt(x, y, 1));
      const pb = Math.max(40, paperAt(x, y, 2));
      // white balance: divide by the paper colour
      const r = Math.min(255, (d[i] / pr) * 255);
      const g = Math.min(255, (d[i + 1] / pg) * 255);
      const b = Math.min(255, (d[i + 2] / pb) * 255);
      const dark = 255 - Math.min(r, g, b); // how far below white the darkest channel is
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const a = smoothstep(30, 75, Math.max(dark, sat * 1.2));
      o[i] = r;
      o[i + 1] = g;
      o[i + 2] = b;
      o[i + 3] = Math.round(a * 255);
      if (a > 0.5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // 2b. Fill the inside of closed shapes: a face drawn as an outline should be
  // a white face, not a see-through ring. Flood the "outside" from the image
  // border through non-ink pixels (ink slightly thickened so small gaps in the
  // outline don't leak); everything not reached is inside → opaque.
  {
    const ink = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) ink[p] = o[p * 4 + 3] > 90 ? 1 : 0;
    const R = 2;
    const thick = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!ink[y * w + x]) continue;
        for (let dy = -R; dy <= R; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -R; dx <= R; dx++) {
            const xx = x + dx;
            if (xx >= 0 && xx < w) thick[yy * w + xx] = 1;
          }
        }
      }
    }
    const outside = new Uint8Array(w * h);
    const stack: number[] = [];
    const seed = (p: number) => {
      if (!thick[p] && !outside[p]) {
        outside[p] = 1;
        stack.push(p);
      }
    };
    for (let x = 0; x < w; x++) {
      seed(x);
      seed((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      seed(y * w);
      seed(y * w + w - 1);
    }
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % w;
      if (x > 0) seed(p - 1);
      if (x < w - 1) seed(p + 1);
      if (p >= w) seed(p - w);
      if (p < w * (h - 1)) seed(p + w);
    }
    for (let p = 0; p < w * h; p++) {
      if (!outside[p] && o[p * 4 + 3] < 255) {
        o[p * 4 + 3] = 255;
        const x = p % w;
        const y = (p - x) / w;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // 3. Crop (fall back to the whole picture if almost nothing was found).
  if (maxX < 0 || (maxX - minX) * (maxY - minY) < w * h * 0.004) {
    minX = 0; minY = 0; maxX = w - 1; maxY = h - 1;
  }
  const pad = Math.round(Math.max(w, h) * 0.02);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  const full = canvasOf(w, h);
  full.getContext('2d')!.putImageData(out, 0, 0);
  const sprite = canvasOf(cw, ch);
  sprite.getContext('2d')!.drawImage(full, minX, minY, cw, ch, 0, 0, cw, ch);

  const framed = canvasOf(cw, ch);
  framed.getContext('2d')!.drawImage(base, minX, minY, cw, ch, 0, 0, cw, ch);

  // 4. Small JPEG of the cropped original for the AI.
  const s = Math.min(1, 768 / Math.max(cw, ch));
  const ai = canvasOf(Math.round(cw * s), Math.round(ch * s));
  ai.getContext('2d')!.drawImage(framed, 0, 0, ai.width, ai.height);
  const jpeg = ai.toDataURL('image/jpeg', 0.85).split(',')[1] ?? '';

  return {
    sprite: sprite.toDataURL('image/png'),
    framed: framed.toDataURL('image/png'),
    jpegForAI: jpeg,
    width: cw,
    height: ch,
  };
}
