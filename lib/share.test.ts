import { test } from "node:test";
import assert from "node:assert/strict";
import { toQuery, fromQuery } from "./share.ts";
import { preset, STEPS } from "./steps.ts";

test("the default playground has a clean URL", () => {
  assert.equal(toQuery(preset("square", 5)), "");
});

test("a recipe is shared by name and count", () => {
  assert.equal(toQuery(preset("saw", 25)), "r=saw&n=25");
});

test("custom terms are shared as size:speed pairs", () => {
  assert.equal(toQuery(STEPS.bigThird()), "t=1:1,1:3");
  assert.equal(toQuery(STEPS.sneakTwo()), "t=1:1,1/2:2,1/3:3,1/5:5,1/7:7,1/9:9");
});

test("negative and decimal sizes survive", () => {
  const q = "t=1:1,-1/9:3,0.45:5";
  const p = fromQuery(new URLSearchParams(q))!;
  assert.equal(p.recipe, "custom");
  assert.equal(p.count, 3);
  assert.deepEqual(p.terms.slice(0, 3), [
    { amp: 1, freq: 1 },
    { amp: -1 / 9, freq: 3 },
    { amp: 0.45, freq: 5 },
  ]);
  assert.equal(toQuery(p), q);
});

test("recipes round-trip", () => {
  for (const p of [preset("triangle", 9), preset("square", 100), preset("saw", 1)]) {
    assert.deepEqual(fromQuery(new URLSearchParams(toQuery(p))), p);
  }
});

test("custom playgrounds round-trip", () => {
  for (const p of [STEPS.sneakTwo(), STEPS.bigger(), STEPS.faster()]) {
    const back = fromQuery(new URLSearchParams(toQuery(p)))!;
    assert.equal(back.recipe, "custom");
    assert.equal(back.count, p.count);
    assert.deepEqual(back.terms.slice(0, p.count), p.terms.slice(0, p.count));
  }
});

test("garbage falls back to nothing", () => {
  assert.equal(fromQuery(new URLSearchParams("")), null);
  assert.equal(fromQuery(new URLSearchParams("r=banana&n=5")), null);
  assert.equal(fromQuery(new URLSearchParams("t=one:two")), null);
});

test("counts and speeds are clamped to what the playground allows", () => {
  assert.equal(fromQuery(new URLSearchParams("r=square&n=9999"))!.count, 100);
  assert.equal(fromQuery(new URLSearchParams("r=square&n=0"))!.count, 1);
  assert.equal(fromQuery(new URLSearchParams("t=1:500"))!.terms[0].freq, 199);
});

test("starting angles are shared in degrees as a third field", () => {
  const p = fromQuery(new URLSearchParams("t=1:1:90,1/3:3"))!;
  assert.ok(Math.abs((p.terms[0].phase ?? 0) - Math.PI / 2) < 1e-9);
  assert.equal(p.terms[1].phase ?? 0, 0);
  assert.equal(toQuery(p), "t=1:1:90,1/3:3");
});
