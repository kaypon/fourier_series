import { MAX_TERMS, type Term } from "./fourier.ts";

/* Picture mode: circles chained tip to tail, now allowed to spin either way
   (a negative `freq` turns clockwise), trace a closed outline in the plane
   instead of a wave. This is the complex Fourier series — each circle is
   amp·e^{i(freq·t + phase)} and the pen sits at their sum. */

export type Point = { x: number; y: number };

/* A freehand outline → `count` points evenly spaced along it, treating it as
   a closed loop (the end joins back to the start). */
export function resampleLoop(points: Point[], count: number): Point[] {
  const n = points.length;
  const seg = points.map((p, i) => {
    const q = points[(i + 1) % n];
    return Math.hypot(q.x - p.x, q.y - p.y);
  });
  const total = seg.reduce((a, b) => a + b, 0);
  if (total === 0) return Array.from({ length: count }, () => ({ ...points[0] }));
  const out: Point[] = [];
  let i = 0;
  let walked = 0;
  for (let k = 0; k < count; k++) {
    const s = (k * total) / count;
    while (i < n - 1 && walked + seg[i] < s) walked += seg[i++];
    const p = points[i];
    const q = points[(i + 1) % n];
    const f = seg[i] === 0 ? 0 : (s - walked) / seg[i];
    out.push({ x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f });
  }
  return out;
}

/* The default picture: a perfect circle, drawn counterclockwise. */
export function circleLoop(count: number): Point[] {
  return Array.from({ length: count }, (_, k) => {
    const t = (2 * Math.PI * k) / count;
    return { x: Math.cos(t), y: Math.sin(t) };
  });
}

/* Evenly spaced outline points (y up) → the circles that redraw it, biggest
   first: speeds −50…50 (minus 0, the center, which centering removes). The
   outline is centered and scaled so its furthest point is 1 from the
   middle. */
export function fitPicture(loop: Point[]): { terms: Term[]; shape: Point[] } {
  const m = loop.length;
  const cx = loop.reduce((a, p) => a + p.x, 0) / m;
  const cy = loop.reduce((a, p) => a + p.y, 0) / m;
  const centered = loop.map((p) => ({ x: p.x - cx, y: p.y - cy }));
  const reach = Math.max(...centered.map((p) => Math.hypot(p.x, p.y)));
  const shape = reach < 1e-9 ? centered : centered.map((p) => ({ x: p.x / reach, y: p.y / reach }));

  const half = MAX_TERMS / 2;
  const terms: Term[] = [];
  for (let n = -half; n <= half; n++) {
    if (n === 0) continue;
    // c_n = (1/m) Σ z_k · e^{−i·n·t_k}
    let re = 0;
    let im = 0;
    for (let k = 0; k < m; k++) {
      const t = (-2 * Math.PI * n * k) / m;
      re += shape[k].x * Math.cos(t) - shape[k].y * Math.sin(t);
      im += shape[k].x * Math.sin(t) + shape[k].y * Math.cos(t);
    }
    re /= m;
    im /= m;
    terms.push({ amp: Math.hypot(re, im), freq: n, phase: Math.atan2(im, re) });
  }
  terms.sort((a, b) => b.amp - a.amp);
  return { terms, shape };
}

/* Where the pen is at moment t (y up). */
export function tracePoint(terms: Term[], t: number): Point {
  let x = 0;
  let y = 0;
  for (const { amp, freq, phase = 0 } of terms) {
    x += amp * Math.cos(freq * t + phase);
    y += amp * Math.sin(freq * t + phase);
  }
  return { x, y };
}

/* The box every circle's outline stays inside over a full turn (y up), so
   the whole chain can be fitted on screen. */
export function pictureExtent(terms: Term[], samples = 128) {
  const e = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  for (let s = 0; s < samples; s++) {
    const t = (2 * Math.PI * s) / samples;
    let x = 0;
    let y = 0;
    for (const { amp, freq, phase = 0 } of terms) {
      const r = Math.abs(amp);
      e.minX = Math.min(e.minX, x - r);
      e.maxX = Math.max(e.maxX, x + r);
      e.minY = Math.min(e.minY, y - r);
      e.maxY = Math.max(e.maxY, y + r);
      x += amp * Math.cos(freq * t + phase);
      y += amp * Math.sin(freq * t + phase);
    }
  }
  return e;
}
