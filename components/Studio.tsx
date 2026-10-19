"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { WaveCanvas } from "@/components/WaveCanvas";
import { FormulaBar } from "@/components/FormulaBar";
import { Spectrum } from "@/components/Spectrum";
import { DrawPad, type StrokePoint } from "@/components/DrawPad";
import { PictureCanvas } from "@/components/PictureCanvas";
import { useTone } from "@/components/useTone";
import { useReducedMotion } from "@/components/useReducedMotion";
import { binStroke, fitDrawing, formatAmp, MAX_TERMS, type Recipe, type Term } from "@/lib/fourier";
import { circleLoop, fitPicture, resampleLoop } from "@/lib/picture";
import { preset, STEPS, type Playground, type StepId } from "@/lib/steps";
import { toQuery } from "@/lib/share";

const RECIPES: Recipe[] = ["square", "saw", "triangle"];

/* Circles shown right after a drawing; the slider reveals the rest. */
const DRAWN_COUNT = 15;
const DRAWN_PICTURE_COUNT = 25;
/* How finely drawings are sampled: enough points for 100 circles. */
const SAMPLES = 256;

/* Picture mode opens on a plain circle — the one picture that takes exactly
   one circle to draw. */
const startPicture = () => ({ ...fitPicture(circleLoop(SAMPLES)), count: 1, drawn: false });

/* A wave stroke has to cross a third of the pad; a picture outline has to be
   more than a dot. */
const acceptWave = (pts: StrokePoint[]) => {
  const us = pts.map((p) => p.u);
  return us.length >= 2 && Math.max(...us) - Math.min(...us) >= 0.33;
};
const acceptPicture = (pts: StrokePoint[], size: { w: number; h: number }) => {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const span = Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys);
  return pts.length >= 3 && span >= 0.25 * Math.min(size.w, size.h);
};

/* Lets the ▶ buttons inside the (server-rendered) explanation drive the
   playground next to it — turn the sound on, open the drawing pad, or
   switch to picture mode. */
type StepControls = {
  play: (id: StepId) => void;
  listen: () => void;
  draw: () => void;
  pictures: () => void;
};
const StepContext = createContext<StepControls>({
  play: () => {},
  listen: () => {},
  draw: () => {},
  pictures: () => {},
});
export const useStep = () => useContext(StepContext);

function describe(terms: Term[]) {
  const shown = terms.slice(0, 4).map((t, i) => {
    const sign = t.amp < 0 ? "minus " : i === 0 ? "" : "plus ";
    return `${sign}${formatAmp(t.amp)} sine ${t.freq}x`;
  });
  return `${terms.length} spinning ${terms.length === 1 ? "circle" : "circles"} drawing the wave ${shown.join(" ")}${terms.length > 4 ? " and more" : ""}`;
}

type StudioProps = {
  /** From the URL, so shared links open on the wave that was shared. */
  initial: Playground;
  explainer: ReactNode;
};

export function Studio({ initial, explainer }: StudioProps) {
  const [state, setState] = useState<Playground>(initial);
  // Reduced-motion visitors start paused; once they hit play/pause, it's theirs.
  const reducedMotion = useReducedMotion();
  const [pausedChoice, setPausedChoice] = useState<boolean | null>(null);
  const paused = pausedChoice ?? reducedMotion;
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [listening, setListening] = useState(false);
  const [spectrum, setSpectrum] = useState(false);
  const [copied, setCopied] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [mode, setMode] = useState<"waves" | "pictures">("waves");
  const [picture, setPicture] = useState(startPicture);
  const drawerRef = useRef<HTMLElement>(null);
  const whatRef = useRef<HTMLButtonElement>(null);

  const visible = useMemo(() => state.terms.slice(0, state.count), [state]);
  const unlockSound = useTone(visible, listening);
  const pictureTerms = useMemo(() => picture.terms.slice(0, picture.count), [picture]);

  // Keep the URL describing the current wave, so the address bar (and the
  // share button) always hands out exactly what's on screen.
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = toQuery(state);
      if (window.location.search !== (q ? `?${q}` : "")) {
        window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!drawing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawing(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawing]);

  useEffect(() => {
    if (!open) return;
    drawerRef.current?.querySelector<HTMLElement>("h2")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        whatRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const setTerm = (index: number, term: Term) =>
    setState((s) => ({
      recipe: "custom",
      count: s.count,
      terms: s.terms.map((t, i) => (i === index ? term : t)),
    }));

  const setCount = (count: number) =>
    setState((s) => ({ ...s, count: Math.min(MAX_TERMS, Math.max(1, count)) }));

  const setUp = (next: Playground) => {
    setMode("waves");
    setState(next);
    setEpoch((e) => e + 1);
    setActive(null);
  };

  const listen = () => {
    unlockSound();
    setMode("waves");
    setListening(true);
  };

  const switchMode = (next: "waves" | "pictures") => {
    setMode(next);
    setDrawing(false);
    setActive(null);
    if (next === "pictures") setListening(false);
  };

  const share = async () => {
    const q = toQuery(state);
    const url = `${window.location.origin}${window.location.pathname}${q ? `?${q}` : ""}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "FOURIER", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      // Share sheet dismissed, or clipboard blocked — nothing to undo.
    }
  };

  const drawnWave = (pts: StrokePoint[]) => {
    const { terms, shape } = fitDrawing(binStroke(pts, SAMPLES));
    setUp({ recipe: "drawn", terms, count: DRAWN_COUNT, shape });
    setDrawing(false);
  };

  const drawnPicture = (pts: StrokePoint[]) => {
    // Screen y points down; the circles' maths has y up.
    const loop = resampleLoop(pts.map((p) => ({ x: p.x, y: -p.y })), SAMPLES);
    setPicture({ ...fitPicture(loop), count: DRAWN_PICTURE_COUNT, drawn: true });
    setDrawing(false);
  };

  const steps = {
    play: (id: StepId) => setUp(STEPS[id]()),
    listen,
    draw: () => {
      switchMode("waves");
      setDrawing(true);
    },
    pictures: () => switchMode("pictures"),
  };

  const ghost =
    state.recipe === "drawn" ? (state.shape ?? null) : state.recipe === "custom" ? null : state.recipe;

  return (
    <StepContext.Provider value={steps}>
      <main className={`studio${open ? " studio--open" : ""}`}>
        <header className="studio-bar">
          <a className="studio-back" href="https://kevdotnet.vercel.app">
            [← van]
          </a>
          <h1 className="studio-title">/Fourier</h1>
          <div className="mode-tabs" role="group" aria-label="Mode">
            {(["waves", "pictures"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`tab${mode === m ? " tab--on" : ""}`}
                aria-pressed={mode === m}
                onClick={() => switchMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <nav className="studio-nav">
            <button
              ref={whatRef}
              type="button"
              className={`btn${open ? " btn--on" : ""}`}
              aria-expanded={open}
              aria-controls="explainer"
              onClick={() => setOpen((o) => !o)}
            >
              what is this?
            </button>
          </nav>
        </header>

        <div className="studio-main">
          <section className="play" aria-label="Playground">
            {/* The tools sit just above the circles they change: shapes and
                drawing on the left, quieter view toggles on the right. */}
            <div className="toolbar">
              <div className="toolbar__group">
                {mode === "waves" &&
                  RECIPES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`btn${state.recipe === r ? " btn--on" : ""}`}
                      aria-pressed={state.recipe === r}
                      onClick={() => setUp(preset(r, state.count))}
                    >
                      {r}
                    </button>
                  ))}
                {mode === "waves" && (state.recipe === "custom" || state.recipe === "drawn") && (
                  <span className="recipes__custom">{state.recipe}</span>
                )}
                <button
                  type="button"
                  className={`btn toolbar__draw${drawing ? " btn--on" : ""}`}
                  aria-pressed={drawing}
                  onClick={() => setDrawing((d) => !d)}
                >
                  draw
                </button>
                {mode === "pictures" && picture.drawn && (
                  <button type="button" className="btn" onClick={() => setPicture(startPicture())}>
                    circle
                  </button>
                )}
              </div>
              <div className="toolbar__group toolbar__group--quiet">
                <button type="button" className="textlink" onClick={() => setPausedChoice(!paused)}>
                  {paused ? "play" : "pause"}
                </button>
                {mode === "waves" && (
                  <>
                    <span className="toolbar__dot" aria-hidden="true">·</span>
                    <button
                      type="button"
                      className={`textlink${listening ? " textlink--on" : ""}`}
                      aria-pressed={listening}
                      onClick={() => (listening ? setListening(false) : listen())}
                    >
                      listen
                    </button>
                    <span className="toolbar__dot" aria-hidden="true">·</span>
                    <button
                      type="button"
                      className={`textlink${spectrum ? " textlink--on" : ""}`}
                      aria-pressed={spectrum}
                      onClick={() => setSpectrum((x) => !x)}
                    >
                      spectrum
                    </button>
                    <span className="toolbar__dot" aria-hidden="true">·</span>
                    <button type="button" className="textlink" onClick={share}>
                      {copied ? "link copied" : "share"}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="stage">
              {mode === "waves" ? (
                <>
                  <WaveCanvas
                    terms={visible}
                    paused={paused}
                    activeIndex={active}
                    epoch={epoch}
                    ghost={ghost}
                    label={describe(visible)}
                  />
                  {drawing && (
                    <DrawPad
                      hint="draw one wiggle, left to right"
                      retryHint="go all the way across: one wiggle, left to right"
                      accept={acceptWave}
                      onDone={drawnWave}
                      onCancel={() => setDrawing(false)}
                    />
                  )}
                </>
              ) : (
                <>
                  <PictureCanvas
                    terms={pictureTerms}
                    shape={picture.shape}
                    paused={paused}
                    activeIndex={active}
                    label={`${picture.count} spinning ${picture.count === 1 ? "circle" : "circles"} drawing ${picture.drawn ? "your outline" : "a circle"}`}
                  />
                  {!drawing && (
                    <p className="stage-hint">
                      {picture.drawn
                        ? "circles spinning both ways, biggest first. slide for more and watch it sharpen"
                        : "a circle takes just one spinning circle. hit draw and sketch something else"}
                    </p>
                  )}
                  {drawing && (
                    <DrawPad
                      hint="draw any shape in one line (it closes itself)"
                      retryHint="bigger: draw a shape across the stage"
                      accept={acceptPicture}
                      onDone={drawnPicture}
                      onCancel={() => setDrawing(false)}
                    />
                  )}
                </>
              )}
            </div>
            {mode === "waves" && spectrum && (
              <Spectrum terms={visible} activeIndex={active} onTerm={setTerm} onActive={setActive} />
            )}
            <div className="controls">
              {mode === "waves" ? (
                <FormulaBar
                  terms={visible}
                  onTerm={setTerm}
                  onActive={setActive}
                  onAdd={() => setCount(state.count + 1)}
                  canAdd={state.count < MAX_TERMS}
                />
              ) : (
                <FormulaBar
                  kind="picture"
                  terms={pictureTerms}
                  onTerm={(index, term) =>
                    setPicture((p) => ({ ...p, terms: p.terms.map((t, i) => (i === index ? term : t)) }))
                  }
                  onActive={setActive}
                  onAdd={() => setPicture((p) => ({ ...p, count: Math.min(MAX_TERMS, p.count + 1) }))}
                  canAdd={picture.count < MAX_TERMS}
                />
              )}
              <label className="slider">
                circles
                <input
                  type="range"
                  min={1}
                  max={MAX_TERMS}
                  value={mode === "waves" ? state.count : picture.count}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (mode === "waves") setCount(n);
                    else setPicture((p) => ({ ...p, count: n }));
                  }}
                />
                <span className="slider__value">{mode === "waves" ? state.count : picture.count}</span>
              </label>
            </div>
          </section>

          <aside
            id="explainer"
            ref={drawerRef}
            className="drawer"
            aria-label="What is this?"
            inert={!open}
          >
            <div className="drawer__inner">
              <button
                type="button"
                className="drawer__close"
                onClick={() => {
                  setOpen(false);
                  whatRef.current?.focus();
                }}
              >
                [× close]
              </button>
              {explainer}
            </div>
          </aside>
        </div>
      </main>
    </StepContext.Provider>
  );
}
