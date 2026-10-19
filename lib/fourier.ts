// The math behind the playground: each term is one circle, `amp` its size,
// `freq` how many turns it makes per turn of the first circle, and `phase`
// the angle it starts at (radians; recipes all start flat, drawings don't).
// The wave is Σ amp·sin(freq·t + phase) — the height of the chain's tip.

export type Term = { amp: number; freq: number; phase?: number };
export type Recipe = "square" | "saw" | "triangle";

/* A run of time during which one set of terms was on screen. The wave keeps a
   short list of these so edits flow in from the circles instead of redrawing
   the whole trail at once. */
export type Segment = { since: number; terms: Term[] };

export const MAX_TERMS = 100;
export const MAX_FREQ = 199;

/* Sizes are shown without the series' leading constant (4/π for the square
   wave), the way the reel writes it: sin x + ⅓ sin 3x + … */
export function recipeTerms(recipe: Recipe, count = MAX_TERMS): Term[] {
  const terms: Term[] = [];
  for (let k = 0; k < count; k++) {
    if (recipe === "square") {
      const n = 2 * k + 1;
      terms.push({ amp: 1 / n, freq: n });
    } else if (recipe === "saw") {
      const n = k + 1;
      terms.push({ amp: (k % 2 === 0 ? 1 : -1) / n, freq: n });
    } else {
      const n = 2 * k + 1;
      terms.push({ amp: (k % 2 === 0 ? 1 : -1) / (n * n), freq: n });
    }
  }
  return terms;
}

/* The perfect shape each recipe is building toward, at the recipe's own
   scale (its sizes leave out the leading constant, so the square lands on
   ±π/4 rather than ±1). Drawn faintly behind the wave as its target. */
export function target(recipe: Recipe, x: number): number {
  if (recipe === "square") return (Math.PI / 4) * Math.sign(Math.sin(x));
  if (recipe === "saw") return (x - 2 * Math.PI * Math.round(x / (2 * Math.PI))) / 2;
  return (Math.PI / 4) * Math.asin(Math.sin(x));
}

export function evaluate(terms: Term[], t: number): number {
  let y = 0;
  for (const { amp, freq, phase = 0 } of terms) y += amp * Math.sin(freq * t + phase);
  return y;
}

/* A starting angle as shown in the formula: whole degrees, 0–359. */
export function toDegrees(phase: number): number {
  return Math.round((((phase * 180) / Math.PI) % 360) + 360) % 360;
}

/* ---------- Drawing your own wave ---------- */

/* A freehand stroke → evenly spaced heights. Points are { u: 0–1 across,
   v: height }; each column averages the points that landed in it, and
   columns the stroke skipped are filled in by straight lines. */
export function binStroke(points: { u: number; v: number }[], columns: number): number[] {
  const sums = new Array<number>(columns).fill(0);
  const counts = new Array<number>(columns).fill(0);
  for (const { u, v } of points) {
    const k = Math.min(columns - 1, Math.max(0, Math.floor(u * columns)));
    sums[k] += v;
    counts[k] += 1;
  }
  const known = counts.flatMap((c, k) => (c ? [k] : []));
  if (!known.length) return new Array<number>(columns).fill(0);
  return sums.map((_, k) => {
    if (counts[k]) return sums[k] / counts[k];
    const lo = known.findLast((j) => j < k);
    const hi = known.find((j) => j > k);
    if (lo === undefined) return sums[hi!] / counts[hi!];
    if (hi === undefined) return sums[lo] / counts[lo];
    const a = sums[lo] / counts[lo];
    const b = sums[hi] / counts[hi];
    return a + ((b - a) * (k - lo)) / (hi - lo);
  });
}

/* One period of a drawn shape (heights left → right) → the circles that
   redraw it: one per speed 1…MAX_TERMS, each with a size and a starting
   angle. The shape is centered (circles can't shift it up or down) and
   scaled to peak at ±1.

   On screen the newest ink is by the circles and older ink slides right,
   so the drawing is read backwards in time: column k is the moment
   t = −2πk/columns. */
export function fitDrawing(samples: number[]): { terms: Term[]; shape: number[] } {
  const m = samples.length;
  const mean = samples.reduce((a, b) => a + b, 0) / m;
  const centered = samples.map((v) => v - mean);
  const top = Math.max(...centered.map(Math.abs));
  const shape = top < 1e-9 ? centered.map(() => 0) : centered.map((v) => v / top);
  const terms: Term[] = [];
  for (let n = 1; n <= MAX_TERMS; n++) {
    let a = 0;
    let b = 0;
    for (let k = 0; k < m; k++) {
      const t = (-2 * Math.PI * k) / m;
      a += shape[k] * Math.cos(n * t);
      b += shape[k] * Math.sin(n * t);
    }
    a *= 2 / m;
    b *= 2 / m;
    // a·cos + b·sin = amp·sin(n·t + phase)
    const amp = Math.hypot(a, b);
    terms.push({ amp: amp < 1e-12 ? 0 : amp, freq: n, phase: amp < 1e-12 ? 0 : Math.atan2(a, b) });
  }
  return { terms, shape };
}

/* The drawn shape's height at moment t — the drawing as a faint target. */
export function shapeAt(shape: number[], t: number): number {
  const u = (((-t / (2 * Math.PI)) % 1) + 1) % 1;
  return shape[Math.round(u * shape.length) % shape.length];
}

/* Tallest point of the wave over one full turn. Sampled densely enough to
   catch the Gibbs spike next to a jump even at 100 circles. */
export function peak(terms: Term[], samples = 2048): number {
  let max = 0;
  for (let i = 0; i < samples; i++) {
    const y = Math.abs(evaluate(terms, (i / samples) * 2 * Math.PI));
    if (y > max) max = y;
  }
  return max;
}

export type Extent = { left: number; right: number; up: number; down: number };

/* How far the chain — every circle's outline, out to the tip — reaches from
   its anchor over one full turn, in units of size. The square recipe's arms
   all line up pointing left once per turn, so the chain reaches Σ|size| that
   way, much further than the first circle alone. */
export function chainExtent(terms: Term[], samples = 256): Extent {
  const e: Extent = { left: 0, right: 0, up: 0, down: 0 };
  for (let s = 0; s < samples; s++) {
    const t = (s / samples) * 2 * Math.PI;
    let x = 0;
    let y = 0;
    for (const { amp, freq, phase = 0 } of terms) {
      const r = Math.abs(amp);
      if (r - x > e.left) e.left = r - x;
      if (x + r > e.right) e.right = x + r;
      if (y + r > e.up) e.up = y + r;
      if (r - y > e.down) e.down = r - y;
      x += amp * Math.cos(freq * t + phase);
      y += amp * Math.sin(freq * t + phase);
    }
  }
  return e;
}

/* Unsigned — the sign is drawn as the +/− in front of the term. */
export function formatAmp(amp: number): string {
  const a = Math.abs(amp);
  if (a < 1e-9) return "0";
  const whole = Math.round(a);
  if (Math.abs(a - whole) < 1e-6) return String(whole);
  for (let q = 2; q <= 12 && a < 1; q++) {
    const p = Math.round(a * q);
    if (p > 0 && Math.abs(a - p / q) < 1e-6) return `${p}/${q}`;
  }
  const inv = 1 / a;
  const k = Math.round(inv);
  if (Math.abs(inv - k) < 1e-6 * inv) return `1/${k}`;
  return String(a >= 0.1 ? Number(a.toFixed(2)) : Number(a.toPrecision(2)));
}

export function parseAmp(text: string): number | null {
  const m = text
    .trim()
    .replace(/−/g, "-")
    .match(/^([+-]?)(\d*\.?\d+)(?:\/(\d*\.?\d+))?$/);
  if (!m) return null;
  const den = m[3] === undefined ? 1 : Number(m[3]);
  if (den === 0) return null;
  const value = (m[1] === "-" ? -1 : 1) * (Number(m[2]) / den);
  return Number.isFinite(value) ? value : null;
}

const SNAP_TARGETS = [
  ...Array.from({ length: 10 }, (_, i) => i + 1),
  ...Array.from({ length: 19 }, (_, i) => 1 / (i + 2)),
];

/* While scrubbing, land on whole numbers and 1/k when you're close to one. */
export function snapAmp(value: number): number {
  const a = Math.abs(value);
  let best = a;
  let bestDist = 0.005;
  for (const target of SNAP_TARGETS) {
    const d = Math.abs(a - target);
    if (d < bestDist) {
      best = target;
      bestDist = d;
    }
  }
  return Math.sign(value) * best;
}

export function clampFreq(freq: number): number {
  return Math.min(MAX_FREQ, Math.max(1, Math.round(freq)));
}

/* Drop segments that ended before `oldest` (the left-most moment still on
   screen), keeping the one that was in effect at that moment. */
export function pruneSegments(segments: Segment[], oldest: number): Segment[] {
  let keep = 0;
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].since <= oldest) keep = i;
  }
  return segments.slice(keep);
}
