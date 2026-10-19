"use client";

import { useEffect, useRef } from "react";
import { pictureExtent, tracePoint, type Point } from "@/lib/picture";
import type { Term } from "@/lib/fourier";

/* Radians per second of a speed-1 circle — one full picture every ~9s. */
const OMEGA = 0.7;
const PAD = 16;
/* Points along one full turn of the pen, for the fading trail. */
const PATH_POINTS = 600;
/* How much of the loop the trail keeps behind the pen. */
const TRAIL = 0.94;

const INK = "#191611";
const CIRCLE = "rgba(117, 107, 89, 0.42)";
const GHOST = "rgba(117, 107, 89, 0.3)";

type PictureCanvasProps = {
  terms: Term[];
  /** The outline being drawn (y up, within ±1), shown faintly as the target. */
  shape: Point[];
  paused: boolean;
  /** Index of the term being hovered/edited in the formula — drawn in ink. */
  activeIndex: number | null;
  label: string;
};

/* Picture mode's stage: the chain of circles spinning both ways, its pen
   leaving a fading trail, and the target outline faint underneath. The
   whole chain is fitted on screen over its full turn. */
export function PictureCanvas({ terms, shape, paused, activeIndex, label }: PictureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const termsRef = useRef(terms);
  const shapeRef = useRef(shape);
  const pausedRef = useRef(paused);
  const activeRef = useRef(activeIndex);
  const pathRef = useRef<Point[]>([]);
  const boxRef = useRef({ minX: -1, maxX: 1, minY: -1, maxY: 1 });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    termsRef.current = terms;
    shapeRef.current = shape;
    pathRef.current = Array.from({ length: PATH_POINTS }, (_, i) =>
      tracePoint(terms, (2 * Math.PI * i) / PATH_POINTS),
    );
    const e = pictureExtent(terms);
    boxRef.current = {
      minX: Math.min(e.minX, -1),
      maxX: Math.max(e.maxX, 1),
      minY: Math.min(e.minY, -1),
      maxY: Math.max(e.maxY, 1),
    };
  }, [terms, shape]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let fit: { scale: number; ox: number; oy: number } | null = null;

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) t = (t + dt * OMEGA) % (2 * Math.PI);

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!w || !h) {
        raf = requestAnimationFrame(frame);
        return;
      }

      // Fit the chain's full reach, centered; ease toward it as circles change.
      const b = boxRef.current;
      const scale = Math.min((w - 2 * PAD) / (b.maxX - b.minX), (h - 2 * PAD) / (b.maxY - b.minY));
      const goal = { scale, ox: w / 2 - ((b.minX + b.maxX) / 2) * scale, oy: h / 2 + ((b.minY + b.maxY) / 2) * scale };
      fit = fit
        ? {
            scale: fit.scale + (goal.scale - fit.scale) * 0.15,
            ox: fit.ox + (goal.ox - fit.ox) * 0.15,
            oy: fit.oy + (goal.oy - fit.oy) * 0.15,
          }
        : goal;
      const sx = (x: number) => fit!.ox + x * fit!.scale;
      const sy = (y: number) => fit!.oy - y * fit!.scale;

      // Target outline.
      const shape = shapeRef.current;
      ctx.strokeStyle = GHOST;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      shape.forEach((p, i) => (i ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y))));
      ctx.closePath();
      ctx.stroke();

      // Fading trail behind the pen.
      const path = pathRef.current;
      const head = Math.floor((t / (2 * Math.PI)) * PATH_POINTS);
      const length = Math.floor(PATH_POINTS * TRAIL);
      const chunks = 24;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let c = 0; c < chunks; c++) {
        ctx.globalAlpha = (c + 1) / chunks;
        ctx.beginPath();
        const from = head - length + Math.floor((c * length) / chunks);
        const to = head - length + Math.floor(((c + 1) * length) / chunks);
        for (let i = from; i <= to; i++) {
          const p = path[((i % PATH_POINTS) + PATH_POINTS) % PATH_POINTS];
          if (i === from) ctx.moveTo(sx(p.x), sy(p.y));
          else ctx.lineTo(sx(p.x), sy(p.y));
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // The chain, from the middle out to the pen.
      let x = 0;
      let y = 0;
      termsRef.current.forEach(({ amp, freq, phase = 0 }, i) => {
        const r = Math.abs(amp) * fit!.scale;
        const nx = x + amp * Math.cos(freq * t + phase);
        const ny = y + amp * Math.sin(freq * t + phase);
        const isActive = i === activeRef.current;
        if (r > 0.6) {
          ctx.strokeStyle = isActive ? INK : CIRCLE;
          ctx.lineWidth = isActive ? 1.75 : 1;
          ctx.beginPath();
          ctx.arc(sx(x), sy(y), r, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (r > 0.3) {
          ctx.strokeStyle = INK;
          ctx.lineWidth = isActive ? 2.5 : 1.6;
          ctx.beginPath();
          ctx.moveTo(sx(x), sy(y));
          ctx.lineTo(sx(nx), sy(ny));
          ctx.stroke();
        }
        x = nx;
        y = ny;
      });
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 3.5, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="stage-canvas" role="img" aria-label={label} />;
}
