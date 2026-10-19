# /FOURIER

Spinning circles that add up to a square wave — and anything else you draw.

**Play with it:** https://fourier-series-lac.vercel.app

I kept seeing posts on Instagram of circles drawing waves, and got hooked on how
smooth spinning circles can add up to sharp corners. So I built my own place to
play with it. The one that started it was a reel by
[@ubilumapp](https://www.instagram.com/ubilumapp/).

## What's in it

- **Waves.** A chain of circles traces a wave, and the formula under it is the
  control panel: every size, speed and starting angle is a box you can drag or
  type into. Square, saw and triangle presets, with the perfect shape drawn
  faintly behind as a target.
- **Draw your own.** Sketch any wiggle and the page works out the circles that
  redraw it.
- **Pictures.** Let the circles spin both ways and they trace any outline. It
  opens on a circle (which takes exactly one); draw something else and watch
  how many it takes.
- **Listen** to the wave you've built, see its **spectrum**, and **share** it —
  the URL always holds the current wave.
- **What is this?** A plain-language explanation with ▶ buttons that drive the
  circles, and the real maths folded away "for the nerds".

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # the maths: series, fitting drawings, sharing
```

Next.js 16, React 19, canvas 2D, KaTeX (rendered on the server) and the Web
Audio API. Styled to match [kevdotnet](https://kevdotnet.vercel.app).
