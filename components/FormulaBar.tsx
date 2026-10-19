"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { NumBox } from "@/components/NumBox";
import { clampFreq, formatAmp, parseAmp, snapAmp, toDegrees, MAX_FREQ, type Term } from "@/lib/fourier";

/* "wave": terms read size·sin(speed·x + angle). "picture": each term is a
   circle in the plane, size·e^i(speed·x + angle), and speeds can be
   negative (spinning clockwise). */
type Kind = "wave" | "picture";

type FormulaBarProps = {
  kind?: Kind;
  terms: Term[];
  onTerm: (index: number, term: Term) => void;
  onActive: (index: number | null) => void;
  onAdd: () => void;
  canAdd: boolean;
};

const round2 = (v: number) => Math.round(v * 100) / 100;

const scrubAmp = (start: number, delta: number) => snapAmp(round2(start + delta * 0.01));
const nudgeAmp = (value: number, dir: 1 | -1) => snapAmp(round2(value + dir * 0.05));
const scrubFreq = (start: number, delta: number) => clampFreq(start + delta / 10);
const nudgeFreq = (value: number, dir: 1 | -1) => clampFreq(value + dir);
const parseFreq = (text: string) => {
  const n = Number(text.trim());
  return Number.isFinite(n) && text.trim() !== "" ? clampFreq(n) : null;
};
/* Picture speeds: any whole number but 0 (a circle that doesn't spin is
   just an offset), positive or negative. */
const signedSpeed = (v: number, dir: number) => {
  const n = Math.max(-MAX_FREQ, Math.min(MAX_FREQ, Math.round(v)));
  return n !== 0 ? n : dir < 0 ? -1 : 1;
};
const scrubSpeed = (start: number, delta: number) => signedSpeed(start + delta / 10, delta);
const nudgeSpeed = (value: number, dir: 1 | -1) =>
  signedSpeed(value + dir === 0 ? value + 2 * dir : value + dir, dir);
const parseSpeed = (text: string) => {
  const n = Number(text.trim().replace("\u2212", "-"));
  return Number.isFinite(n) && text.trim() !== "" ? signedSpeed(n, n) : null;
};
const wrapDeg = (d: number) => ((Math.round(d) % 360) + 360) % 360;
const scrubDeg = (start: number, delta: number) => wrapDeg(start + delta);
const nudgeDeg = (value: number, dir: 1 | -1) => wrapDeg(value + dir * 5);
const parseDeg = (text: string) => {
  const n = Number(text.replace("°", "").trim());
  return Number.isFinite(n) && text.trim() !== "" ? wrapDeg(n) : null;
};

/* Up to this many terms, the whole formula is tried inline first. Past it
   (or when it doesn't fit) the middle folds away: a few terms stay inline
   and "⋯ N more" opens every term in a panel above. */
const FOLD_AFTER = 5;

type Fold = { head: number; tail: number; add: boolean };

/* How much stays inline around the fold, roomiest first. The line steps
   down until it fits its width (a phone, or beside the open drawer). The
   last resort drops "+ term" — the circles slider sits right next to it. */
const FOLDS: Fold[] = [
  { head: 3, tail: 1, add: true },
  { head: 2, tail: 1, add: true },
  { head: 1, tail: 1, add: true },
  { head: 1, tail: 0, add: true },
  { head: 1, tail: 0, add: false },
];

/* null = everything inline. */
function layoutsFor(count: number): (Fold | null)[] {
  return [
    ...(count <= FOLD_AFTER ? [null] : []),
    ...FOLDS.filter((f) => count - f.head - f.tail >= 1),
  ];
}

type TermViewProps = {
  kind: Kind;
  term: Term;
  index: number;
  /** Show each circle's starting angle (once any circle has one). */
  angles: boolean;
  onTerm: FormulaBarProps["onTerm"];
  onActive: FormulaBarProps["onActive"];
};

function TermView({ kind, term, index, angles, onTerm, onActive }: TermViewProps) {
  const negative = term.amp < 0;
  const op = index === 0 ? (negative ? "−" : "") : negative ? "−" : "+";
  const n = index + 1;
  const speed = (
    <NumBox
      value={term.freq}
      display={String(term.freq).replace("-", "−")}
      scrub={kind === "picture" ? scrubSpeed : scrubFreq}
      nudge={kind === "picture" ? nudgeSpeed : nudgeFreq}
      parse={kind === "picture" ? parseSpeed : parseFreq}
      onChange={(freq) => onTerm(index, { ...term, freq })}
      onActive={(on) => onActive(on ? index : null)}
      label={`Speed of circle ${n}`}
    />
  );
  const angle = (
    <NumBox
      className="num--angle"
      value={toDegrees(term.phase ?? 0)}
      display={`${toDegrees(term.phase ?? 0)}°`}
      scrub={scrubDeg}
      nudge={nudgeDeg}
      parse={parseDeg}
      onChange={(deg) => onTerm(index, { ...term, phase: (deg * Math.PI) / 180 })}
      onActive={(on) => onActive(on ? index : null)}
      label={`Starting angle of circle ${n}, in degrees`}
    />
  );
  return (
    <span
      className="term"
      onPointerEnter={(e) => e.pointerType === "mouse" && onActive(index)}
      onPointerLeave={(e) => e.pointerType === "mouse" && onActive(null)}
    >
      {op && <span className="term__op">{op}</span>}
      <NumBox
        value={term.amp}
        display={formatAmp(term.amp)}
        scrub={scrubAmp}
        nudge={nudgeAmp}
        parse={parseAmp}
        onChange={(amp) => onTerm(index, { ...term, amp })}
        onActive={(on) => onActive(on ? index : null)}
        label={`Size of circle ${n}`}
      />
      {kind === "picture" ? (
        <>
          <span className="term__fn">·e</span>
          <sup className="term__exp">
            <span className="term__fn">i(</span>
            {speed}
            <span className="term__fn">x +</span>
            {angle}
            <span className="term__fn">)</span>
          </sup>
        </>
      ) : (
        <>
          <span className="term__fn">·sin(</span>
          {speed}
          {angles ? (
            <>
              <span className="term__fn">x +</span>
              {angle}
              <span className="term__fn">)</span>
            </>
          ) : (
            <span className="term__fn">x)</span>
          )}
        </>
      )}
    </span>
  );
}

/* The formula is the control panel: every term reads [size]·sin([speed]x),
   and both boxes are editable. A term's sign shows as the +/− in front. */
export function FormulaBar({ kind = "wave", terms, onTerm, onActive, onAdd, canAdd }: FormulaBarProps) {
  const [expanded, setExpanded] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const lineRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Start from the roomiest layout whenever the width, term count or angle
  // boxes change, then step down (below) while the line overflows.
  const layouts = layoutsFor(terms.length);
  const angles = kind === "picture" || terms.some((t) => toDegrees(t.phase ?? 0) !== 0);
  const fitKey = `${width}|${terms.length}|${angles}`;
  const [fit, setFit] = useState({ key: fitKey, level: 0 });
  const level = Math.min(fit.key === fitKey ? fit.level : 0, layouts.length - 1);
  const layout = layouts[level];

  useEffect(() => {
    const el = lineRef.current!;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // `terms` too: an edit can widen a box (1/3 → 0.33) without changing the key.
  const lastLevel = layouts.length - 1;
  useLayoutEffect(() => {
    const el = lineRef.current!;
    if (level < lastLevel && el.scrollWidth > el.clientWidth + 1) {
      setFit({ key: fitKey, level: level + 1 });
    }
  }, [level, lastLevel, fitKey, terms]);

  const view = (term: Term, index: number) => (
    <TermView
      key={index}
      kind={kind}
      term={term}
      index={index}
      angles={angles}
      onTerm={onTerm}
      onActive={onActive}
    />
  );

  const fold = () => {
    setExpanded(false);
    moreRef.current?.focus();
  };

  return (
    <>
      {layout && expanded && (
        <div
          id={panelId}
          className="formula-panel"
          role="group"
          aria-label={`All ${terms.length} terms`}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !(e.target instanceof HTMLInputElement)) {
              e.stopPropagation();
              fold();
            }
          }}
        >
          <div className="formula-panel__head">
            <span>all {terms.length} terms</span>
            <button type="button" className="btn" onClick={fold}>
              fold ▴
            </button>
          </div>
          <div className="formula-panel__terms">{terms.map(view)}</div>
        </div>
      )}
      <div ref={lineRef} className="formula" role="group" aria-label="Formula">
        {layout ? (
          <>
            {terms.slice(0, layout.head).map(view)}
            <span className="term__op">+</span>
            <button
              ref={moreRef}
              type="button"
              className={`btn formula__more${expanded ? " btn--on" : ""}`}
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpanded((x) => !x)}
            >
              ⋯ {terms.length - layout.head - layout.tail} more
            </button>
            {layout.tail > 0 && view(terms[terms.length - 1], terms.length - 1)}
          </>
        ) : (
          terms.map(view)
        )}
        {canAdd && (layout?.add ?? true) && (
          <button type="button" className="btn formula__add" onClick={onAdd}>
            + term
          </button>
        )}
      </div>
    </>
  );
}
