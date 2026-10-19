import { test } from "node:test";
import assert from "node:assert/strict";
import { resampleLoop, fitPicture, tracePoint, pictureExtent, circleLoop } from "./picture.ts";
import { MAX_TERMS } from "./fourier.ts";

const close = (a: number, b: number, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not within ${eps} of ${b}`);

test("resampleLoop spaces points evenly around the closed outline", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  const r = resampleLoop(square, 8);
  const expected = [
    [0, 0], [0.5, 0], [1, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 1], [0, 0.5],
  ];
  r.forEach((p, i) => {
    close(p.x, expected[i][0]);
    close(p.y, expected[i][1]);
  });
});

test("a circle takes exactly one circle", () => {
  const { terms } = fitPicture(circleLoop(256));
  close(terms[0].amp, 1, 1e-9);
  assert.equal(terms[0].freq, 1);
  assert.ok(terms.slice(1).every((t) => t.amp < 1e-9));
  assert.equal(terms.length, MAX_TERMS);
});

test("circles come biggest first, spinning both ways", () => {
  const loop = Array.from({ length: 256 }, (_, k) => {
    const t = (2 * Math.PI * k) / 256;
    return { x: Math.cos(t) + 0.3 * Math.cos(-2 * t), y: Math.sin(t) + 0.3 * Math.sin(-2 * t) };
  });
  const { terms } = fitPicture(loop);
  assert.equal(terms[0].freq, 1);
  assert.equal(terms[1].freq, -2);
  assert.ok(terms[0].amp > terms[1].amp && terms[1].amp > terms[2].amp);
});

test("all the circles together redraw the outline (centered, scaled to fit ±1)", () => {
  const square = resampleLoop(
    [
      { x: 3, y: 3 },
      { x: 5, y: 3 },
      { x: 5, y: 5 },
      { x: 3, y: 5 },
    ],
    256,
  );
  const { terms, shape } = fitPicture(square);
  for (const k of [0, 40, 100, 211]) {
    const p = tracePoint(terms, (2 * Math.PI * k) / 256);
    close(p.x, shape[k].x, 0.02);
    close(p.y, shape[k].y, 0.02);
  }
  close(Math.max(...shape.map((p) => Math.hypot(p.x, p.y))), 1, 1e-9);
});

test("pictureExtent covers every circle over a full turn", () => {
  const e = pictureExtent([{ amp: 1, freq: 1, phase: 0 }]);
  close(e.minX, -1, 0.01);
  close(e.maxX, 1, 0.01);
  close(e.minY, -1, 0.01);
  close(e.maxY, 1, 0.01);
  const two = pictureExtent([
    { amp: 1, freq: 1, phase: 0 },
    { amp: 0.5, freq: -1, phase: 0 },
  ]);
  close(two.maxX, 1.5, 0.01);
});

test("pictureExtent sizes a negative circle by its magnitude", () => {
  const e = pictureExtent([{ amp: -1, freq: 1, phase: 0 }]);
  close(e.minX, -1, 0.01);
  close(e.maxX, 1, 0.01);
});
