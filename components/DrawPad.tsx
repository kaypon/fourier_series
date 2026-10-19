"use client";

import { useRef, useState, type PointerEvent } from "react";

/* `u` 0–1 across the pad and `v` height (±1 ≈ 80% of the pad's height) are
   what wave drawing uses; `x`/`y` are raw pixels for picture outlines. */
export type StrokePoint = { u: number; v: number; x: number; y: number };
export type PadSize = { w: number; h: number };

type DrawPadProps = {
  hint: string;
  /** Shown when a stroke doesn't pass `accept`. */
  retryHint: string;
  accept: (points: StrokePoint[], size: PadSize) => boolean;
  onDone: (points: StrokePoint[], size: PadSize) => void;
  onCancel: () => void;
};

/* Covers the stage while drawing. One stroke; on release it's handed over
   (if it passes `accept`) to be turned into circles. */
export function DrawPad({ hint, retryHint, accept, onDone, onCancel }: DrawPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<StrokePoint[]>([]);
  const [tooShort, setTooShort] = useState(false);

  const toPoint = (e: PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      u: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      v: (r.height / 2 - (e.clientY - r.top)) / (r.height * 0.4),
      x: e.clientX - r.left,
      y: e.clientY - r.top,
    };
  };

  const ink = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(canvas.clientWidth * dpr)) {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    }
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "#191611";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const last = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone; draw without capture.
    }
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    const p = toPoint(e);
    points.current = [p];
    last.current = p;
    setTooShort(false);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!last.current) return;
    const p = toPoint(e);
    points.current.push(p);
    ink(last.current, p);
    last.current = p;
  };

  const onPointerUp = () => {
    if (!last.current) return;
    last.current = null;
    const canvas = canvasRef.current!;
    const size = { w: canvas.clientWidth, h: canvas.clientHeight };
    if (!accept(points.current, size)) {
      setTooShort(true);
      return;
    }
    onDone(points.current, size);
  };

  return (
    <div className="drawpad">
      <canvas
        ref={canvasRef}
        className="drawpad__canvas"
        aria-label={`Drawing pad: ${hint}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (last.current = null)}
      />
      <div className="drawpad__hint">
        <span>{tooShort ? retryHint : hint}</span>
        <button type="button" className="btn" onClick={onCancel}>
          cancel
        </button>
      </div>
    </div>
  );
}
