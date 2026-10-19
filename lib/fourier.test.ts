import { test } from "node:test";
import assert from "node:assert/strict";
import {
  recipeTerms,
  evaluate,
  peak,
  formatAmp,
  parseAmp,
  snapAmp,
  clampFreq,
  pruneSegments,
  chainExtent,
  target,
  binStroke,
  fitDrawing,
  shapeAt,
  toDegrees,
  MAX_TERMS,
} from "./fourier.ts";

const close = (a: number, b: number, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not within ${eps} of ${b}`);

test("square recipe: odd speeds, 1/n sizes", () => {
  const t = recipeTerms("square", 3);
  assert.deepEqual(t.map((x) => x.freq), [1, 3, 5]);
  close(t[0].amp, 1);
  close(t[1].amp, 1 / 3);
  close(t[2].amp, 1 / 5);
});

test("saw recipe: every speed, alternating 1/n sizes", () => {
  const t = recipeTerms("saw", 4);
  assert.deepEqual(t.map((x) => x.freq), [1, 2, 3, 4]);
  close(t[0].amp, 1);
  close(t[1].amp, -1 / 2);
  close(t[2].amp, 1 / 3);
  close(t[3].amp, -1 / 4);
});

test("triangle recipe: odd speeds, alternating 1/n² sizes", () => {
  const t = recipeTerms("triangle", 3);
  assert.deepEqual(t.map((x) => x.freq), [1, 3, 5]);
  close(t[0].amp, 1);
  close(t[1].amp, -1 / 9);
  close(t[2].amp, 1 / 25);
});

test("recipes default to the full term list", () => {
  assert.equal(recipeTerms("square").length, MAX_TERMS);
});

test("evaluate sums the sines", () => {
  const t = recipeTerms("square", 2);
  close(evaluate(t, 0), 0);
  close(evaluate(t, Math.PI / 2), 1 - 1 / 3);
});

test("square series at the top of the wave approaches π/4 (Leibniz)", () => {
  close(evaluate(recipeTerms("square", MAX_TERMS), Math.PI / 2), Math.PI / 4, 0.006);
});

test("peak of one circle is its size", () => {
  close(peak([{ amp: 2, freq: 1 }]), 2, 1e-3);
});

test("square peak overshoots π/4 by the Gibbs ~18%", () => {
  const p = peak(recipeTerms("square", MAX_TERMS));
  close(p / (Math.PI / 4), 1.179, 0.01);
});

test("peak of nothing is 0", () => {
  assert.equal(peak([]), 0);
});

test("formatAmp shows sizes as friendly unsigned numbers", () => {
  assert.equal(formatAmp(1), "1");
  assert.equal(formatAmp(1 / 3), "1/3");
  assert.equal(formatAmp(-1 / 9), "1/9");
  assert.equal(formatAmp(2 / 3), "2/3");
  assert.equal(formatAmp(0.45), "0.45");
  assert.equal(formatAmp(2.5), "2.5");
  assert.equal(formatAmp(0), "0");
  assert.equal(formatAmp(1 / 39601), "1/39601");
});

test("parseAmp reads fractions and decimals", () => {
  close(parseAmp("1/3")!, 1 / 3);
  close(parseAmp("-1/9")!, -1 / 9);
  close(parseAmp(" 0.5 ")!, 0.5);
  close(parseAmp("2")!, 2);
  close(parseAmp("−2")!, -2);
  assert.equal(parseAmp(""), null);
  assert.equal(parseAmp("abc"), null);
  assert.equal(parseAmp("1/0"), null);
});

test("snapAmp pulls near-misses onto 1/k and whole numbers", () => {
  close(snapAmp(0.334), 1 / 3);
  close(snapAmp(-0.143), -1 / 7);
  close(snapAmp(1.004), 1);
  close(snapAmp(0.4), 0.4);
  close(snapAmp(0.27), 0.27);
});

test("clampFreq keeps speeds whole and in range", () => {
  assert.equal(clampFreq(3.6), 4);
  assert.equal(clampFreq(0), 1);
  assert.equal(clampFreq(500), 199);
});

test("pruneSegments keeps only what's still visible", () => {
  const segs = [
    { since: 0, terms: [] },
    { since: 2, terms: [] },
    { since: 4, terms: [] },
    { since: 8, terms: [] },
  ];
  assert.deepEqual(pruneSegments(segs, 5).map((s) => s.since), [4, 8]);
  assert.deepEqual(pruneSegments(segs, 1).map((s) => s.since), [0, 2, 4, 8]);
  assert.deepEqual(pruneSegments(segs, 9).map((s) => s.since), [8]);
});

test("chainExtent of one circle is its radius every way", () => {
  const e = chainExtent([{ amp: 1, freq: 1 }]);
  close(e.left, 1, 1e-6);
  close(e.right, 1, 1e-6);
  close(e.up, 1, 1e-6);
  close(e.down, 1, 1e-6);
});

test("chainExtent catches the square chain lining up to the left", () => {
  const terms = recipeTerms("square", 5);
  const sum = terms.reduce((s, t) => s + t.amp, 0);
  close(chainExtent(terms).left, sum, 1e-6);
});

test("chainExtent counts negative sizes by their magnitude", () => {
  const e = chainExtent([{ amp: -2, freq: 1 }]);
  close(e.left, 2, 1e-6);
  close(e.up, 2, 1e-6);
});

test("chainExtent of nothing is 0", () => {
  assert.deepEqual(chainExtent([]), { left: 0, right: 0, up: 0, down: 0 });
});

test("target: the shapes each recipe is aiming for, at the recipe's scale", () => {
  close(target("square", Math.PI / 2), Math.PI / 4);
  close(target("square", -Math.PI / 2), -Math.PI / 4);
  close(target("saw", 1), 0.5);
  close(target("saw", 2 * Math.PI + 1), 0.5);
  close(target("saw", -1), -0.5);
  close(target("triangle", Math.PI / 2), (Math.PI * Math.PI) / 8);
  close(target("triangle", 0), 0);
});

test("target matches its recipe's series at many terms", () => {
  for (const recipe of ["square", "saw", "triangle"] as const) {
    const terms = recipeTerms(recipe);
    for (const x of [0.4, 1.3, 2.2, 4.0, 5.5]) {
      close(evaluate(terms, x), target(recipe, x), 0.03);
    }
  }
});

test("a term's phase turns its circle's starting angle", () => {
  close(evaluate([{ amp: 1, freq: 1, phase: Math.PI / 2 }], 0), 1);
  close(evaluate([{ amp: 2, freq: 3, phase: Math.PI }], Math.PI / 6), -2);
});

test("chainExtent follows phases too", () => {
  const e = chainExtent([{ amp: 1, freq: 1, phase: Math.PI / 2 }]);
  close(e.up, 1, 1e-6);
  close(e.left, 1, 1e-6);
});

test("toDegrees gives a whole 0–359 angle", () => {
  assert.equal(toDegrees(0), 0);
  assert.equal(toDegrees(Math.PI / 2), 90);
  assert.equal(toDegrees(-Math.PI / 2), 270);
  assert.equal(toDegrees(2 * Math.PI + 0.001), 0);
});

const M = 256;
const sampled = (f: (u: number) => number) => Array.from({ length: M }, (_, k) => f(k / M));

test("binStroke averages points per column and fills the gaps", () => {
  const s = binStroke([{ u: 0, v: 0 }, { u: 0.5, v: 1 }, { u: 0.999, v: 0 }], 4);
  assert.deepEqual(s.map((v) => Number(v.toFixed(3))), [0, 0.5, 1, 0]);
  const flat = binStroke([{ u: 0.5, v: 0.3 }, { u: 0.6, v: 0.3 }], 8);
  assert.ok(flat.every((v) => Math.abs(v - 0.3) < 1e-9));
});

test("fitDrawing finds one circle in a drawn sine", () => {
  // On screen, older ink slides right, so a wave that dips going right is
  // sin(t) played forwards.
  const { terms, shape } = fitDrawing(sampled((u) => -Math.sin(2 * Math.PI * u)));
  close(terms[0].amp, 1, 1e-6);
  assert.equal(terms[0].freq, 1);
  close(Math.cos(terms[0].phase ?? 0), 1, 1e-6);
  assert.ok(terms.slice(1).every((t) => Math.abs(t.amp) < 1e-6));
  assert.equal(shape.length, M);
});

test("fitDrawing's circles redraw the drawing (centered, scaled to ±1)", () => {
  const drawn = sampled((u) => 2 + 0.5 * Math.sin(2 * Math.PI * u) + 0.3 * Math.cos(6 * Math.PI * u));
  const { terms, shape } = fitDrawing(drawn);
  for (const k of [0, 33, 102, 197]) {
    const tau = (-2 * Math.PI * k) / M;
    close(evaluate(terms, tau), shapeAt(shape, tau), 1e-6);
  }
  close(Math.max(...shape.map(Math.abs)), 1, 1e-9);
  close(shape.reduce((a, b) => a + b, 0) / M, 0, 1e-9);
});

test("fitDrawing gives MAX_TERMS circles, one per speed", () => {
  const { terms } = fitDrawing(sampled((u) => (u < 0.5 ? 1 : -1)));
  assert.equal(terms.length, MAX_TERMS);
  assert.deepEqual(terms.slice(0, 3).map((t) => t.freq), [1, 2, 3]);
});

test("fitDrawing of a flat line is silent", () => {
  const { terms } = fitDrawing(sampled(() => 0.4));
  assert.ok(terms.every((t) => t.amp === 0));
});
