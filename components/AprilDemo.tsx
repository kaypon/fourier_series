"use client";

import { useState } from "react";
import { WaveCanvas } from "@/components/WaveCanvas";
import { useTone } from "@/components/useTone";
import { useReducedMotion } from "@/components/useReducedMotion";
import type { Term } from "@/lib/fourier";

type Option = { label: string; terms: Term[] };

type AprilDemoProps = {
  /** One picture per option; with more than one, big buttons switch between them. */
  options: Option[];
  label: string;
  /** Show a button to hear it. */
  sound?: boolean;
  /** Spin speed multiplier — slower is easier to follow. */
  speed?: number;
};

/* A picture for the /april page: wheels drawing their line. Built for a
   phone: full width, tap the picture to pause it, big buttons. */
export function AprilDemo({ options, label, sound, speed = 0.7 }: AprilDemoProps) {
  const [choice, setChoice] = useState(0);
  const [tapPaused, setTapPaused] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const reducedMotion = useReducedMotion();
  const paused = tapPaused ?? reducedMotion;
  const { terms } = options[choice];
  const unlock = useTone(terms, playing);

  return (
    <figure className="april-demo">
      <button
        type="button"
        className="april-demo__stage"
        aria-label={paused ? "Play the picture" : "Pause the picture"}
        onClick={() => setTapPaused(!paused)}
      >
        <WaveCanvas
          terms={terms}
          paused={paused}
          activeIndex={null}
          epoch={choice}
          ghost={null}
          speed={speed}
          label={label}
        />
        <span className="april-demo__hint" aria-hidden="true">
          {paused ? "paused · tap to play" : "tap to pause"}
        </span>
      </button>
      {(options.length > 1 || sound) && (
        <div className="april-demo__buttons">
          {options.length > 1 &&
            options.map((o, i) => (
              <button
                key={o.label}
                type="button"
                className={`btn${i === choice ? " btn--on" : ""}`}
                aria-pressed={i === choice}
                onClick={() => setChoice(i)}
              >
                {o.label}
              </button>
            ))}
          {sound && (
            <button
              type="button"
              className={`btn april-demo__sound${playing ? " btn--on" : ""}`}
              aria-pressed={playing}
              onClick={() => {
                if (!playing) unlock();
                setPlaying(!playing);
              }}
            >
              {playing ? "■ stop sound" : "♪ hear it"}
            </button>
          )}
        </div>
      )}
    </figure>
  );
}
