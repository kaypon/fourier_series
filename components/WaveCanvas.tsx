"use client";

import { useEffect, useRef } from "react";
import {
  chainExtent,
  pruneSegments,
  shapeAt,
  target,
  type Extent,
  type Recipe,
  type Segment,
  type Term,
} from "@/lib/fourier";

/* Radians of the first circle per second — one full turn every ~4s. */
const OMEGA = 1.6;

const INK = "#191611";
const CIRCLE = "rgba(117, 107, 89, 0.42)";
const FAINT = "rgba(117, 107, 89, 0.22)";
const GHOST = "rgba(117, 107, 89, 0.38)";

/* Breathing room (px) between the chain's furthest reach and the stage edge. */
const PAD = 12;

type WaveCanvasProps = {
  terms: Term[];
  paused: boolean;
  /** Index of the term being hovered/edited in the formula — drawn in ink. */
  activeIndex: number | null;
  /** Bumped when the playground is set up from scratch (a ▶ step or recipe
   * button): the whole wave redraws instead of the change flowing in. */
  epoch: number;
  /** The shape drawn faintly behind the wave, as the target the circles are
   * building toward: a recipe's perfect shape, or the heights of a drawing
   * (see fitDrawing). null for hand-built waves. */
  ghost: Recipe | number[] | null;
  /** Multiplier on the spin speed (the /april page slows it down). */
  speed?: number;
  label: string;
};

/* The stage: the circle chain on the left, a dashed line from its tip, and
   the wave trailing off to the right. The wave isn't a recorded trail — each
   column is evaluated exactly from the terms that were on screen at that
   moment (see Segment), so edits flow in from the circles like the reel
   without the aliasing a sampled trail gets at 100 circles. */
export function WaveCanvas({
  terms,
  paused,
  activeIndex,
  epoch,
  ghost,
  speed = 1,
  label,
}: WaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);
  const segmentsRef = useRef<Segment[]>([{ since: -Infinity, terms }]);
  // Filled by the terms effect below, which runs before the first frame.
  const extentRef = useRef<Extent>({ left: 0, right: 0, up: 0, down: 0 });
  const pausedRef = useRef(paused);
  const activeRef = useRef(activeIndex);
  const epochRef = useRef(epoch);
  const ghostRef = useRef(ghost);
  const speedRef = useRef(speed);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    ghostRef.current = ghost;
  }, [ghost]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    // A fresh setup redraws everything; so does an edit while paused, since
    // there's no "later" for new terms to flow into.
    const fresh = epoch !== epochRef.current;
    epochRef.current = epoch;
    segmentsRef.current =
      fresh || pausedRef.current
        ? [{ since: -Infinity, terms }]
        : [...segmentsRef.current, { since: phaseRef.current, terms }];
    extentRef.current = chainExtent(terms);
  }, [terms, epoch]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let scale = 0;
    let left = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) phaseRef.current += dt * OMEGA * speedRef.current;
      const phase = phaseRef.current;

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

      // Size 1 is a fixed radius unless the chain's full reach over a turn
      // (extentRef) would leave the stage — then everything eases down to
      // fit. The chain hangs from the left edge by its reach that way; the
      // wave starts just past the first circle.
      const segments = segmentsRef.current;
      const current = segments[segments.length - 1].terms;
      const ext = extentRef.current;
      const lead = current.length ? Math.abs(current[0].amp) : 0;
      const room = Math.min(h, w * 0.62);
      const gap = room * 0.12;
      const fit = Math.min(
        room * 0.28,
        (h / 2 - PAD) / Math.max(ext.up, ext.down, 1e-6),
        (w * 0.62 - PAD - gap) / Math.max(ext.left + lead, 1e-6),
      );
      const first = scale === 0;
      scale = first ? fit : scale + (fit - scale) * 0.15;
      left = first ? ext.left : left + (ext.left - left) * 0.15;

      const cx = PAD + left * scale;
      const cy = h / 2;
      const waveX = cx + lead * scale + gap;
      const pxPerRad = Math.max(16, (w - waveX) / (4.4 * Math.PI));

      // Center line.
      ctx.strokeStyle = FAINT;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      // Circle chain.
      let x = cx;
      let y = cy;
      const active = activeRef.current;
      for (let i = 0; i < current.length; i++) {
        const { amp, freq, phase: start = 0 } = current[i];
        const r = Math.abs(amp) * scale;
        const nx = x + amp * scale * Math.cos(freq * phase + start);
        const ny = y - amp * scale * Math.sin(freq * phase + start);
        const isActive = i === active;
        if (r > 0.6) {
          ctx.strokeStyle = isActive ? INK : CIRCLE;
          ctx.lineWidth = isActive ? 1.75 : 1;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = INK;
        ctx.lineWidth = isActive ? 2.5 : 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        if (r > 6) {
          ctx.fillStyle = INK;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        x = nx;
        y = ny;
      }

      // Tip → wave.
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = CIRCLE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(waveX, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // The target shape, faint, behind the wave.
      const goal = ghostRef.current;
      if (goal) {
        ctx.strokeStyle = GHOST;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "miter";
        ctx.beginPath();
        for (let px = waveX; px <= w + 1; px += 1) {
          const tau = phase - (px - waveX) / pxPerRad;
          const py = cy - (typeof goal === "string" ? target(goal, tau) : shapeAt(goal, tau)) * scale;
          if (px === waveX) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // The wave: column by column, walking back through time.
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      let seg = segments.length - 1;
      for (let px = waveX; px <= w + 1; px += 1) {
        const tau = phase - (px - waveX) / pxPerRad;
        while (seg > 0 && segments[seg].since > tau) seg--;
        const ts = segments[seg].terms;
        let v = 0;
        for (let i = 0; i < ts.length; i++) {
          v += ts[i].amp * Math.sin(ts[i].freq * tau + (ts[i].phase ?? 0));
        }
        const py = cy - v * scale;
        if (px === waveX) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      const oldest = phase - (w - waveX) / pxPerRad;
      if (segments.length > 1 && segments[1].since <= oldest) {
        segmentsRef.current = pruneSegments(segments, oldest);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="stage-canvas" role="img" aria-label={label} />;
}
