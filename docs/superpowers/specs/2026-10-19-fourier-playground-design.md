# Fourier playground — design

## Intent

An interactive page for playing with the Fourier series: a chain of spinning
circles traces a wave, and the formula under it is the control panel. Inspired
by an @ubilumapp Instagram reel (one circle + its sine wave, then 3×/⅓, 5×/⅕ …
building a square wave). It ships as a standalone app and a project entry on
Kevin's site (kevs_site), so it must look like it belongs there.

## Audience

Curious people who just saw a reel like that one: comfortable with high-school
math, not calculus. The heavier math is there for "nerds", folded away.

## What it does

**Opens straight onto the playground** (no landing page):

- Top bar: `[← van]`, `/FOURIER` title, `WHAT IS THIS?` button on the right.
- Stage: the circle chain on the left, a dashed line from the chain's tip to the
  wave, and the wave scrolling right (new points enter by the dashed line, like
  the reel).
- Bottom: the formula is the control panel. Every term reads
  `[size]·sin([speed]x)` and both boxes are editable (drag sideways to scrub,
  click to type). Next to the formula: the CIRCLES slider (how many terms),
  `+ TERM`, and wave-recipe buttons (square / saw / triangle).

**WHAT IS THIS? opens a side drawer** (mockup A) from the right. The playground
stays live beside it. Explanation steps carry ▶ buttons that set the playground
up (e.g. "▶ add one: 3× faster, ⅓ the size"). Outline (approved):

1. One circle, one wave
2. Stacking circles = adding waves
3. Building the square wave (nerds: full formula with 4/π)
4. Why only odd speeds, why shrink them (▶ sneak in a 2× circle; nerds: deriving 4/(nπ))
5. The ripple that never goes away — Gibbs (▶ 100 circles; nerds: why ~9%)
6. Other recipes, other shapes (▶ saw, ▶ triangle)
7. Fourier's big idea, 1807, heat (nerds: circles are e^(inx))
8. Where you meet it every day (synths/clarinet, MP3, JPEG, radio)
9. Credit: inspired by @ubilumapp on Instagram, linked

Nerd boxes are collapsed `for the nerds` blocks under their section, with
KaTeX-typeset math.

## Look

kevs_site tokens and voice: paper `#f2f2f0`, ink `#191611`, muted `#756b59`;
Archivo Black uppercase display; Courier New for everything else; SVG grain
overlay; outlined square uppercase mono buttons; bracketed links. Monochrome:
ink wave on paper (no blue).

## Stack (Claude's call)

Next.js 16 App Router + React 19 + TypeScript + plain CSS, mirroring kevs_site's
config. KaTeX rendered on the server for the nerd math. Canvas 2D for the stage.
Pure math in `lib/fourier.ts`, unit-tested with `node --test`.

## Calls made without asking (check these)

- **Slider vs hand edits:** the playground keeps a full list of 100 terms built
  from the current recipe; the slider only shows more or fewer of them. Hand
  edits change entries in that list and switch the recipe label to CUSTOM, so
  they survive sliding down and back up. Picking a recipe resets the list.
  `+ TERM` is one more circle (slider + 1).
- **Speeds are whole numbers** (1–199, enough for 100 square-wave circles), so the wave always repeats. Sizes can be
  any number, including negative (the triangle recipe needs negative sizes); a
  term's sign shows as the `+`/`−` in front of it.
- Sizes are shown without the 4/π factor, like the reel (`sin x + ⅓ sin 3x`).
- **The whole chain always stays on screen** (user asked): the drawing is
  sized and placed from the chain's full reach over a turn, not just the
  first circle. The square recipe's arms all line up pointing left once per
  turn, so the chain hangs that far in from the left edge, and the drawing
  shrinks as circles are added or a size is cranked up.
- The wave is evaluated exactly per pixel from the terms that were active at
  that moment, so edits flow in from the circles (like the reel) without the
  aliasing a sampled trail gets at 100 circles.
- **Long formulas fold** (user picked "fold the middle"): past 5 terms, or
  whenever the line doesn't fit, it keeps the first few terms and the last
  one inline and folds the rest into `⋯ N more`, which opens every term in a
  panel above the formula. The line steps down (3 head terms → 2 → 1 → no
  tail → no `+ TERM`) until it fits its measured width, so it adapts to phones
  and to the open drawer without scrolling sideways.
- Opens on the square recipe with 5 circles.
- Pause button; no speed control in v1.
- Phones: stage on top, folded formula and slider below, drawer becomes a
  sheet over the lower part of the screen.
- `[← van]` links to kevdotnet.vercel.app.

## Added after v1 (2026-10-19)

- **Shareable links:** the URL always describes the current wave
  (`?r=saw&n=25`, or `?t=1:1,1/2:2,…` size:speed pairs for hand-built ones);
  SHARE copies it (share sheet on phones). Opening a link restores the wave.
- **Ghost target:** for square/saw/triangle, the perfect shape is drawn
  faintly behind the wave. Hidden once the wave is custom.
- **Listen:** plays the current wave as sound — one oscillator whose
  harmonics are exactly the terms, first circle at A3 (220 Hz), normalised so
  edits change timbre, not volume. Section 8 has ▶ buttons that play
  examples.
- **Spectrum:** toggleable strip of bars (one per circle, placed by speed,
  height = size, below the line when negative); drag a bar to edit.
- **Link preview image** (`app/opengraph-image.tsx`) in the site's look.
- **/april** (unlinked: reachable only by typing the URL; the "MY NAME IS
  APRIL" button was removed at the user's request): the whole idea explained like
  you're five, built phone-first — one column, a live tap-to-pause picture
  per step, thumb-sized buttons, slowed-down wheels. Covers: dot on a wheel →
  watching only its height → the string and pencil drawing the line → that's
  a sine wave → bigger/faster wheels → wheel on a wheel → lots of wheels make
  a box → sound and why it matters.

- **Draw your own wave** (user picked angle display "A"): DRAW turns the
  stage into a pad; one stroke left to right is one turn of the first
  circle. On release the drawing is centered, scaled to ±1 and fitted with
  100 circles (one per speed, each with a size and a starting angle); 15 show
  at first and the slider reveals more. The drawing stays as the faint
  target (label DRAWN) until a term is hand-edited. Terms gained an optional
  `phase`; once any circle has one, every term shows a dashed degree box
  (`0.66·sin(1x + 90°)`), editable like the others. Shared links carry
  angles as a third field (`size:speed:degrees`); the faint drawing itself
  isn't shared.

- **Picture mode** (WAVES / PICTURES switch in the top bar): circles chained
  tip to tail, spinning both ways (the complex Fourier series), trace a
  closed outline with a fading trail and the target outline faint behind.
  It opens on a plain circle (user's call), which takes exactly one circle.
  DRAW takes any outline in one line (it closes itself); it's resampled
  evenly along its length, centered and scaled, and fitted with 100 circles
  (speeds −50…50) sorted biggest first; 25 show at first, the slider reveals
  more, CIRCLE goes back to the default. The whole chain is fitted on screen
  over its full turn. No formula, sound, spectrum or sharing in this mode.

- **Picture formula:** picture mode shows its own formula bar, one term per
  circle as `size·e^i(speed·x + angle)` (exponent raised; negative speeds spin
  clockwise), editable and folding like the wave formula.
- **Decluttered top bar** (user picked "split by job"): the top bar holds only
  `[← van]`, the title, WAVES / PICTURES tabs and WHAT IS THIS?. The tools moved to a row just above the stage: shapes
  and DRAW as boxed buttons on the left, pause · listen · spectrum · share as
  quieter underline-when-on text on the right.

## Non-goals (v1)

Non-integer speeds; sharing pictures by link.
Deploying and adding the kevs_site project entry happen after Kevin has seen it
running locally.
