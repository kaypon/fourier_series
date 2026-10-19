import type { Metadata } from "next";
import Link from "next/link";
import { AprilDemo } from "@/components/AprilDemo";
import { recipeTerms } from "@/lib/fourier";

export const metadata: Metadata = {
  title: "HI APRIL — FOURIER",
  description: "Wheels on wheels that draw wiggly lines, explained as simply as possible.",
};

const wheels = (n: number) => recipeTerms("square", n);

/* The "my name is april" page: the whole idea, explained like you're five.
   Mostly read on a phone, so it's one column of short sentences, each part
   with its own picture right there. */
export default function AprilPage() {
  return (
    <main className="april">
      <div className="april__inner">
        <Link href="/" className="april__back">
          [← back to the circles]
        </Link>
        <h1 className="april__title">/Hi April</h1>
        <p className="april__lede">
          Here&apos;s what this whole thing is about. No math, promise. Tap any picture to pause
          it.
        </p>

        <section className="april__part">
          <h2>1. A dot on a wheel</h2>
          <AprilDemo options={[{ label: "one wheel", terms: wheels(1) }]} label="One wheel with a dot on it." speed={0.5} />
          <p>See the circle? It&apos;s a wheel.</p>
          <p>
            There&apos;s a line from the middle to the edge, like the hand on a clock. At the end of
            the hand there&apos;s a dot.
          </p>
          <p>The wheel spins, so the dot goes round and round and round. Forever.</p>
        </section>

        <section className="april__part">
          <h2>2. Only watch how high it is</h2>
          <AprilDemo options={[{ label: "one wheel", terms: wheels(1) }]} label="The dot's height carried to the right by a dotted line." speed={0.5} />
          <p>Now forget about left and right. Only watch how <b>high</b> the dot is.</p>
          <p>Up to the top… down through the middle… all the way to the bottom… and back up.</p>
          <p>
            See the dotted line going to the right? It&apos;s like a string tied to the dot. When
            the dot goes up, the string goes up. When the dot goes down, the string goes down.
          </p>
        </section>

        <section className="april__part">
          <h2>3. Drawing the line</h2>
          <AprilDemo options={[{ label: "one wheel", terms: wheels(1) }]} label="A pencil at the end of the string draws a wiggly line." speed={0.5} />
          <p>At the end of the string there&apos;s a pencil. It only goes up and down, with the dot.</p>
          <p>
            But the paper under the pencil keeps sliding to the right, like a moving sidewalk.
          </p>
          <p>
            So the pencil draws a long wiggly line across the paper. Up, down, up, down. The
            newest bit is by the dot, and the older bits slide away to the right.
          </p>
        </section>

        <section className="april__part">
          <h2>4. That wiggle is a sine wave</h2>
          <p>
            This smooth, even wiggle has a name: a <b>sine wave</b>. You say it like
            &quot;sign.&quot;
          </p>
          <p>Every sine wave comes from one wheel spinning. That&apos;s all it is!</p>
        </section>

        <section className="april__part">
          <h2>5. Big wheel, fast wheel</h2>
          <AprilDemo
            options={[
              { label: "small wheel", terms: [{ amp: 0.5, freq: 1 }] },
              { label: "big wheel", terms: [{ amp: 1, freq: 1 }] },
              { label: "fast wheel", terms: [{ amp: 0.5, freq: 3 }] },
            ]}
            label="Try a small wheel, a big wheel, and a fast wheel."
          />
          <p>Tap the buttons under the picture to try.</p>
          <p>
            A <b>bigger</b> wheel lifts the dot higher, so the wiggle gets <b>taller</b>.
          </p>
          <p>
            A <b>faster</b> wheel moves the dot up and down more times, so the wiggles get{" "}
            <b>squished</b> together.
          </p>
        </section>

        <section className="april__part">
          <h2>6. A wheel on a wheel</h2>
          <AprilDemo options={[{ label: "two wheels", terms: wheels(2) }]} label="A small fast wheel riding on the end of a big wheel." speed={0.5} />
          <p>
            Now the fun part. Stick a little wheel onto the end of the big wheel&apos;s hand. The
            little wheel spins 3 times faster.
          </p>
          <p>The dot rides on the little wheel, and the little wheel rides on the big wheel. Wheee!</p>
          <p>The pencil adds both wiggles together. Look: the tops got flatter.</p>
        </section>

        <section className="april__part">
          <h2>7. Lots of wheels</h2>
          <AprilDemo
            options={[
              { label: "2 wheels", terms: wheels(2) },
              { label: "5 wheels", terms: wheels(5) },
              { label: "25 wheels", terms: wheels(25) },
            ]}
            label="More and more wheels make a boxy line."
          />
          <p>Add more wheels. Each one is smaller and faster than the one before.</p>
          <p>
            Tap 2, then 5, then 25. The top gets flatter, the bottom gets flatter, and the jumps get
            steeper.
          </p>
          <p>
            With lots of wheels it&apos;s almost a perfect <b>box</b> shape, like stairs. Round
            wheels made sharp corners. That&apos;s the whole trick!
          </p>
        </section>

        <section className="april__part">
          <h2>8. Why it&apos;s cool</h2>
          <AprilDemo
            options={[
              { label: "one wheel", terms: wheels(1) },
              { label: "lots of wheels", terms: wheels(25) },
            ]}
            label="Listen to one wheel, then lots of wheels."
            sound
          />
          <p>
            Sounds are wiggly lines too! Turn your volume down a bit, tap &quot;hear it,&quot;
            then switch between the buttons.
          </p>
          <p>One wheel sounds like a soft beep. Lots of wheels sounds buzzy, like a robot.</p>
          <p>
            Every sound you hear is lots of wiggles mixed together: music, your voice, a dog
            barking. Your phone uses this trick to make songs and pictures small enough to send.
          </p>
          <p>
            A man named Joseph Fourier figured it out more than 200 years ago. That&apos;s why
            this is called a <b>Fourier series</b>.
          </p>
        </section>

        <Link href="/" className="btn april__play">
          now play with the wheels yourself →
        </Link>
      </div>
    </main>
  );
}
