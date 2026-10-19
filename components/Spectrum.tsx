"use client";

import { useRef, type PointerEvent } from "react";
import { formatAmp, snapAmp, type Term } from "@/lib/fourier";

type SpectrumProps = {
  terms: Term[];
  activeIndex: number | null;
  onTerm: (index: number, term: Term) => void;
  onActive: (index: number | null) => void;
};

const W = 1000;
const H = 120;
const MID = H / 2;
const REACH = MID - 14;

const round2 = (v: number) => Math.round(v * 100) / 100;

/* The same terms as the formula, seen as a spectrum: one bar per circle,
   placed by speed, as tall as its size (below the line when negative).
   Drag a bar up or down to change that circle's size. */
export function Spectrum({ terms, activeIndex, onTerm, onActive }: SpectrumProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ index: number; scale: number } | null>(null);

  const slots = Math.max(9, ...terms.map((t) => t.freq));
  const scale = Math.max(1, ...terms.map((t) => Math.abs(t.amp)));
  const slot = W / slots;
  const barW = Math.max(2, slot * 0.55);

  const toSvg = (e: PointerEvent<SVGSVGElement>) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const nearest = (x: number) => {
    let best = 0;
    terms.forEach((t, i) => {
      if (Math.abs((t.freq - 0.5) * slot - x) < Math.abs((terms[best].freq - 0.5) * slot - x)) best = i;
    });
    return best;
  };

  const setFromY = (index: number, y: number, s: number) => {
    const amp = snapAmp(round2(((MID - y) / REACH) * s));
    onTerm(index, { ...terms[index], amp });
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!terms.length || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toSvg(e);
    // Freeze the vertical scale for the drag, or growing the tallest bar
    // would rescale everything under the pointer.
    const index = nearest(x);
    drag.current = { index, scale };
    onActive(index);
    setFromY(index, y, scale);
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const { x, y } = toSvg(e);
    if (drag.current) setFromY(drag.current.index, y, drag.current.scale);
    else if (e.pointerType === "mouse" && terms.length) onActive(nearest(x));
  };

  const end = () => {
    drag.current = null;
    onActive(null);
  };

  const active = activeIndex !== null ? terms[activeIndex] : undefined;

  return (
    <div className="spectrum">
      <div className="spectrum__label">
        <span>spectrum: size by speed</span>
        {active && (
          <span className="spectrum__value">
            {active.amp < 0 ? "−" : ""}
            {formatAmp(active.amp)} at {active.freq}×
          </span>
        )}
      </div>
      <svg
        ref={svgRef}
        className="spectrum__plot"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Spectrum: one bar per circle, placed by speed, as tall as its size. Drag a bar to change it."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={(e) => e.pointerType === "mouse" && !drag.current && onActive(null)}
      >
        <line x1={0} x2={W} y1={MID} y2={MID} className="spectrum__axis" />
        {terms.map((t, i) => {
          const h = (Math.abs(t.amp) / scale) * REACH;
          return (
            <rect
              key={i}
              x={(t.freq - 0.5) * slot - barW / 2}
              y={t.amp >= 0 ? MID - h : MID}
              width={barW}
              height={Math.max(h, 0.5)}
              className={`spectrum__bar${i === activeIndex ? " spectrum__bar--active" : ""}`}
            />
          );
        })}
      </svg>
      <div className="spectrum__ticks" aria-hidden="true">
        <span>1×</span>
        <span>{slots}×</span>
      </div>
    </div>
  );
}
