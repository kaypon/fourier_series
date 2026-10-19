import type { ReactNode } from "react";
import { DrawStep, PicturesStep, Step } from "@/components/Step";
import { TeX } from "@/components/TeX";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ex-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Nerd({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="nerd">
      <summary>for the nerds: {title}</summary>
      <div className="nerd__body">{children}</div>
    </details>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <div className="steps">{children}</div>;
}

/* The drawer's contents. Plain-language track for anyone who just saw the
   reel; the heavier math is folded into "for the nerds" boxes. */
export function Explainer() {
  return (
    <article className="ex">
      <h2 tabIndex={-1}>What is this?</h2>
      <p className="ex-lede">
        A wave built entirely out of spinning circles. Everything here has ▶ buttons that set
        up the circles next to it, so you can read a line and watch it happen. You can also grab
        any number in the formula: drag it to scrub, or tap it to type.
      </p>

      <Section title="1. One circle, one wave">
        <p>Start with a single circle and an arm spinning around it.</p>
        <Steps>
          <Step id="one">one circle</Step>
        </Steps>
        <p>
          Watch the dot on the end of the arm, and only pay attention to how high it is. As it
          goes around it rises, falls, dips below the middle line and comes back up. Write that
          height down over time, sliding the older values off to the right, and you get the
          smooth curve next to it: a <b>sine wave</b>.
        </p>
        <p>
          Two numbers describe it completely. <b>Size</b> is how big the circle is, which sets
          how tall the wave is. <b>Speed</b> is how fast it spins, which sets how bunched up the
          wave is. In the formula they&apos;re the two boxes in <code>1·sin(1x)</code>: size in
          front, speed inside.
        </p>
        <Steps>
          <Step id="bigger">make it bigger: size 2</Step>
          <Step id="faster">make it faster: speed 3</Step>
        </Steps>
      </Section>

      <Section title="2. Stacking circles adds waves">
        <p>
          Now hang a second circle off the end of the first arm. It rides around on the first
          circle while spinning on its own, so the dot at the very end moves with both. Its
          height is the first wave <i>plus</i> the second. Adding circles is adding waves.
        </p>
        <Steps>
          <Step id="two">add one: 3× faster, ⅓ the size</Step>
        </Steps>
        <p>
          That&apos;s <code>sin x + ⅓ sin 3x</code>. Look at what the small, fast circle does. At the
          top of the big wave it&apos;s pointing down, so it shaves the peak off. Near the middle
          it&apos;s pointing the same way as the big circle, so it pushes the sides out. The top
          flattens and the sides get steeper.
        </p>
      </Section>

      <Section title="3. Building the square wave">
        <p>
          Keep going with the same rule. Each new circle spins at the next odd speed (5×, 7×,
          9×…) and is that much smaller (⅕, ⅐, ⅑…).
        </p>
        <Steps>
          <Step id="five">5 circles</Step>
          <Step id="nine">9 circles</Step>
          <Step id="twentyFive">25 circles</Step>
        </Steps>
        <p>
          Every new circle fixes some of the error the others left behind, at a finer scale.
          The flat parts get flatter, the jumps get sharper, and the sum gets closer and closer
          to a <b>square wave</b>: a signal that&apos;s simply on or off. Smooth circles, sharp
          corners. The faint line behind the wave is the perfect square it&apos;s aiming for.
        </p>
        <Nerd title="the exact formula">
          <TeX block>
            {String.raw`\begin{aligned} \text{square}(x) &= \frac{4}{\pi}\left(\sin x + \frac{\sin 3x}{3} + \frac{\sin 5x}{5} + \cdots\right) \\ &= \frac{4}{\pi}\sum_{k=0}^{\infty} \frac{\sin\big((2k+1)x\big)}{2k+1} \end{aligned}`}
          </TeX>
          <p>
            The <TeX>{String.raw`\tfrac{4}{\pi}`}</TeX> makes the wave jump between exactly −1
            and +1. The formula on this page leaves it out, like the reel did, and the drawing
            just scales itself to fit.
          </p>
          <p>
            A bonus: at <TeX>{String.raw`x = \tfrac{\pi}{2}`}</TeX> the square wave equals 1,
            and every <TeX>{String.raw`\sin\big((2k+1)\tfrac{\pi}{2}\big)`}</TeX> is just ±1. So
          </p>
          <TeX block>{String.raw`1 = \frac{4}{\pi}\left(1 - \frac13 + \frac15 - \frac17 + \cdots\right)`}</TeX>
          <p>and rearranging gives</p>
          <TeX block>{String.raw`\frac{\pi}{4} = 1 - \frac13 + \frac15 - \frac17 + \cdots`}</TeX>
          <p>which is the Leibniz formula for π, falling out of a square wave.</p>
        </Nerd>
      </Section>

      <Section title="4. Why only odd speeds, and why smaller?">
        <p>
          A square wave&apos;s bottom half is its top half flipped upside down. Odd-speed circles
          have the same habit: half a turn of the big circle later, they&apos;re pointing the
          opposite way. Even-speed circles don&apos;t. After half a turn they&apos;re right back
          where they started, so they push the top and bottom halves the same way and wreck the
          symmetry.
        </p>
        <Steps>
          <Step id="sneakTwo">sneak in a 2× circle</Step>
        </Steps>
        <p>
          The top and bottom don&apos;t match anymore. Drag the ½ in front of{" "}
          <code>sin(2x)</code> down to 0 and watch it heal.
        </p>
        <p>
          The shrinking (⅓, ⅕, ⅐…) is exactly how big each circle has to be to cancel the
          error the others leave. Get it wrong and the shape falls apart:
        </p>
        <Steps>
          <Step id="bigThird">make the 3× circle full size</Step>
        </Steps>
        <Nerd title="where ⅓, ⅕, ⅐ come from">
          <p>
            Any reasonable shape that repeats every <TeX>{String.raw`2\pi`}</TeX> can be written
            as
          </p>
          <TeX block>{String.raw`f(x) = \frac{a_0}{2} + \sum_{n=1}^{\infty} \big(a_n \cos nx + b_n \sin nx\big)`}</TeX>
          <p>
            The trick for finding each size is that different speeds are{" "}
            <b>orthogonal</b>: multiply two of them together and they cancel out over a full
            turn.
          </p>
          <TeX block>{String.raw`\int_{-\pi}^{\pi} \sin mx \,\sin nx \; dx = \begin{cases} \pi & m = n \\ 0 & m \neq n \end{cases}`}</TeX>
          <p>
            So multiply both sides by <TeX>{String.raw`\sin nx`}</TeX> and integrate. Every term
            except the <TeX>n</TeX>th vanishes, leaving
          </p>
          <TeX block>{String.raw`b_n = \frac{1}{\pi}\int_{-\pi}^{\pi} f(x)\sin nx \; dx`}</TeX>
          <p>
            For the square wave (−1 on <TeX>{String.raw`(-\pi, 0)`}</TeX>, +1 on{" "}
            <TeX>{String.raw`(0, \pi)`}</TeX>) every <TeX>{String.raw`a_n`}</TeX> is 0 because
            the wave is odd, and
          </p>
          <TeX block>{String.raw`\begin{aligned} b_n &= \frac{2}{\pi}\int_0^{\pi} \sin nx \; dx = \frac{2}{n\pi}\big(1 - \cos n\pi\big) \\ &= \begin{cases} \dfrac{4}{n\pi} & n \text{ odd} \\[4pt] 0 & n \text{ even} \end{cases} \end{aligned}`}</TeX>
          <p>
            So the even circles aren&apos;t just unwanted. Their sizes come out as exactly zero.
            The symmetry argument says the same thing: if{" "}
            <TeX>{String.raw`f(x + \pi) = -f(x)`}</TeX>, then since{" "}
            <TeX>{String.raw`\sin n(x+\pi) = (-1)^n \sin nx`}</TeX>, only odd{" "}
            <TeX>n</TeX> can survive.
          </p>
        </Nerd>
      </Section>

      <Section title="5. The ripple that never goes away">
        <p>
          Look closely at the corners, against the faint perfect square behind the wave. Right
          next to each jump the wave overshoots it and wobbles. You&apos;d expect more circles to
          smooth that out.
        </p>
        <Steps>
          <Step id="hundred">100 circles</Step>
        </Steps>
        <p>
          They don&apos;t. The wobbles get squeezed tighter against the jump, but the first spike
          stays about <b>9% of the jump</b> too tall no matter how many circles you add. This is
          the <b>Gibbs phenomenon</b>, and it shows up anywhere you build a sharp edge out of
          waves. It&apos;s behind the faint halos you sometimes see around sharp edges in
          heavily compressed photos.
        </p>
        <Nerd title="why it's stuck at ~9%">
          <p>
            With <TeX>N</TeX> circles, the first peak sits at{" "}
            <TeX>{String.raw`x = \tfrac{\pi}{2N}`}</TeX>. As <TeX>N</TeX> grows, the peak moves
            toward the jump but its height doesn&apos;t shrink. It approaches
          </p>
          <TeX block>{String.raw`\frac{2}{\pi}\operatorname{Si}(\pi) = \frac{2}{\pi}\int_0^{\pi} \frac{\sin t}{t}\,dt \approx 1.1790`}</TeX>
          <p>
            The wave jumps from −1 to +1 (a jump of 2), so the overshoot is{" "}
            <TeX>{String.raw`0.179 / 2 \approx 8.95\%`}</TeX> of the jump.
          </p>
          <p>
            So in what sense does the series &quot;become&quot; a square wave? At every single
            point away from the jump, yes. In total squared error,{" "}
            <TeX>{String.raw`\int |f - S_N|^2 \to 0`}</TeX>, also yes. But the worst-case error
            never drops below 0.179, so the convergence isn&apos;t <i>uniform</i>. A sum of
            smooth curves can&apos;t hug a jump everywhere at once.
          </p>
        </Nerd>
      </Section>

      <Section title="6. Other recipes, other shapes">
        <p>
          The square wave is one recipe: odd speeds, sizes 1/speed. Change the recipe and you
          get a different shape. The buttons in the top bar switch between them too.
        </p>
        <Steps>
          <Step id="saw">sawtooth</Step>
          <Step id="triangle">triangle</Step>
        </Steps>
        <p>
          <b>Sawtooth</b> uses every speed (1×, 2×, 3×…) with sizes 1, ½, ⅓, ¼… and alternating
          signs. You get a ramp that climbs steadily, then drops.
        </p>
        <p>
          <b>Triangle</b> goes back to odd speeds, but the sizes shrink much faster: 1, 1/9,
          1/25, 1/49 (one over the speed <i>squared</i>), again with alternating signs.
        </p>
        <p>
          Notice how the triangle looks nearly perfect with just a few circles, while the square
          and the saw need dozens. That&apos;s a general rule: <b>the smoother the shape, the
          faster the circles shrink, and the fewer you need.</b> Shapes with jumps shrink like
          1/speed. Shapes with corners but no jumps shrink like 1/speed². Perfectly smooth
          shapes shrink faster still.
        </p>
        <p>
          Change any box in the formula and the recipe label switches to{" "}
          <span className="ex-tag">custom</span>. You&apos;re building your own wave now.
        </p>
        <Nerd title="the other two formulas">
          <p>
            Sawtooth, for <TeX>{String.raw`-\pi < x < \pi`}</TeX> (and repeating from there):
          </p>
          <TeX block>{String.raw`\begin{aligned} \frac{x}{2} &= \sin x - \frac{\sin 2x}{2} + \frac{\sin 3x}{3} - \cdots \\ &= \sum_{n=1}^{\infty} (-1)^{n+1}\frac{\sin nx}{n} \end{aligned}`}</TeX>
          <p>Triangle:</p>
          <TeX block>{String.raw`\text{triangle}(x) = \frac{8}{\pi^2}\sum_{k=0}^{\infty} (-1)^k \frac{\sin\big((2k+1)x\big)}{(2k+1)^2}`}</TeX>
          <p>
            Why smoothness controls the shrinking: integrate{" "}
            <TeX>{String.raw`b_n = \tfrac{1}{\pi}\int f(x)\sin nx\,dx`}</TeX> by parts and you
            pick up a factor of <TeX>{String.raw`\tfrac{1}{n}`}</TeX> while{" "}
            <TeX>f</TeX> turns into <TeX>{String.raw`f'`}</TeX>. A jump in <TeX>f</TeX> stops
            you after one step, so <TeX>{String.raw`b_n \sim 1/n`}</TeX>. A jump in{" "}
            <TeX>{String.raw`f'`}</TeX> (a corner) stops you after two, so{" "}
            <TeX>{String.raw`b_n \sim 1/n^2`}</TeX>. Every extra smooth derivative buys another
            factor of <TeX>n</TeX>.
          </p>
        </Nerd>
      </Section>

      <Section title="7. Fourier's big idea">
        <p>
          In 1807, Joseph Fourier was working out how heat spreads through a solid. Sine waves
          were easy to handle in his equations, so he made a bold claim: <b>any</b> repeating
          shape, however jagged, can be built by adding up sine waves at whole-number speeds.
        </p>
        <p>
          The leading mathematicians of the day, Lagrange among them, weren&apos;t convinced.
          How could smooth curves add up to a corner? His paper sat unpublished for years, and
          it took most of the next century to pin down exactly when the claim holds. But it
          holds for basically every shape you&apos;d ever draw.
        </p>
        <p>
          The upshot: every repeating signal is secretly a list of circles. The speeds tell you
          which &quot;notes&quot; are in it and the sizes tell you how loud each one is. That
          list is called its <b>spectrum</b>, and finding it is what a{" "}
          <b>Fourier transform</b> does.
        </p>
        <p>
          Try it. Sketch any wiggle you like and the page works out the circles for it: a size,
          a speed and a starting angle for each one. Then slide the circles up and watch the
          copy sharpen.
        </p>
        <Steps>
          <DrawStep>draw your own wave</DrawStep>
        </Steps>
        <p>
          Let the circles spin both ways and they can draw pictures, not just waves. A plain
          circle is the easy one: it takes exactly one. Draw any outline and watch how many
          circles it takes to get it right.
        </p>
        <Steps>
          <PicturesStep>picture mode</PicturesStep>
        </Steps>
        <p>
          Hit <span className="ex-tag">spectrum</span> in the top bar to see it for whatever
          you&apos;ve built: one bar per circle, placed by speed, as tall as its size. You can drag
          the bars too.
        </p>
        <Nerd title="why circles?">
          <p>
            In complex numbers, a point spinning around a circle of radius <TeX>r</TeX> at speed{" "}
            <TeX>n</TeX> is
          </p>
          <TeX block>{String.raw`r\,e^{inx} = r\cos nx + i\,r\sin nx`}</TeX>
          <p>
            Its height (the imaginary part) is <TeX>{String.raw`r \sin nx`}</TeX>, exactly one
            term of the series. So the chain on this page is the sum{" "}
            <TeX>{String.raw`\sum b_n e^{inx}`}</TeX>, and the wave is the height of its tip.
            (Its sideways position traces a different series,{" "}
            <TeX>{String.raw`\sum b_n \cos nx`}</TeX>, which the page ignores.)
          </p>
          <p>The full complex Fourier series lets circles spin both ways:</p>
          <TeX block>{String.raw`f(x) = \sum_{n=-\infty}^{\infty} c_n e^{inx}`}</TeX>
          <TeX block>{String.raw`c_n = \frac{1}{2\pi}\int_{-\pi}^{\pi} f(x)\,e^{-inx}\,dx`}</TeX>
          <p>
            With both directions available, a chain of circles can trace any closed shape in the
            plane, not just a wave. That&apos;s how those videos of circles drawing portraits
            work.
          </p>
        </Nerd>
      </Section>

      <Section title="8. Where you meet this every day">
        <ul className="ex-list">
          <li>
            <b>Sound.</b> A note from an instrument is a base circle plus a stack of faster ones
            (harmonics). Their sizes are why a piano and a violin playing the same note sound
            different. A clarinet&apos;s sound is mostly odd harmonics, like this square wave,
            which is a big part of why it sounds hollow. Classic synthesizers start from square
            and saw waves and filter circles out. Hear it for yourself (turn your volume down
            first):
            <span className="steps">
              <Step id="one" listen>
                one circle: a pure tone
              </Step>
              <Step id="twentyFive" listen>
                square: buzzy
              </Step>
              <Step id="triangle" listen>
                triangle: soft
              </Step>
              <Step id="saw" listen>
                saw: bright
              </Step>
            </span>
            <span className="ex-li-note">
              <span className="ex-tag">listen</span> in the top bar plays whatever you&apos;ve
              built. Drag a size while it plays and the sound changes with it.
            </span>
          </li>
          <li>
            <b>Music files.</b> MP3 and AAC split sound into frequencies and throw away the ones
            your ears won&apos;t miss.
          </li>
          <li>
            <b>Photos.</b> JPEG does the same thing in 2D, with cosine waves across little 8×8
            blocks of pixels. It keeps the big, slow waves and drops the fine detail.
          </li>
          <li>
            <b>Radio, Wi-Fi and phones.</b> Each station or channel sits at its own frequency.
            Your device listens for one circle speed and ignores the rest.
          </li>
          <li>
            <b>And more:</b> MRI scanners, earthquake analysis, and the equalizer in your music
            app.
          </li>
        </ul>
      </Section>

      <footer className="ex-credit">
        <p>
          Inspired by{" "}
          <a href="https://www.instagram.com/ubilumapp/" target="_blank" rel="noopener noreferrer">
            @ubilumapp
          </a>{" "}
          on Instagram, whose reel built a square wave one circle at a time.
        </p>
        <p>
          Made by <a href="https://kevdotnet.vercel.app">VAN</a>.
        </p>
      </footer>
    </article>
  );
}
