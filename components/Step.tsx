"use client";

import type { ReactNode } from "react";
import { useStep } from "@/components/Studio";
import type { StepId } from "@/lib/steps";

/* A ▶ button in the explanation that sets up the playground beside it
   (and, with `listen`, turns the sound on so you hear it too). */
export function Step({ id, listen, children }: { id: StepId; listen?: boolean; children: ReactNode }) {
  const steps = useStep();
  return (
    <button
      type="button"
      className="step"
      onClick={() => {
        steps.play(id);
        if (listen) steps.listen();
      }}
    >
      <span aria-hidden="true">▶ </span>
      {children}
    </button>
  );
}

/* A ▶ button that opens the drawing pad on the stage. */
export function DrawStep({ children }: { children: ReactNode }) {
  const steps = useStep();
  return (
    <button type="button" className="step" onClick={steps.draw}>
      <span aria-hidden="true">▶ </span>
      {children}
    </button>
  );
}

/* A ▶ button that switches the stage to picture mode. */
export function PicturesStep({ children }: { children: ReactNode }) {
  const steps = useStep();
  return (
    <button type="button" className="step" onClick={steps.pictures}>
      <span aria-hidden="true">▶ </span>
      {children}
    </button>
  );
}
