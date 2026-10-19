"use client";

import { useEffect, useRef } from "react";
import type { Term } from "@/lib/fourier";

/* The first circle's pitch (A3). Every other circle is a harmonic of it:
   speed 3 sounds at 3 × 220 Hz. */
const BASE_HZ = 220;
const VOLUME = 0.12;
/* Seconds for volume and timbre changes to settle — short enough to feel
   live while dragging, long enough not to click. */
const SMOOTH = 0.03;

type Voice = { ctx: AudioContext; osc: OscillatorNode; gain: GainNode };

/* Plays the current wave as sound. All the circles become one oscillator
   with a custom waveform whose harmonics are exactly the terms, so the
   speaker draws the same shape as the screen. The browser normalises the
   waveform, so editing a size changes the timbre, not the loudness. */
export function useTone(terms: Term[], on: boolean) {
  const voice = useRef<Voice | null>(null);

  useEffect(() => {
    const v = voice.current;
    if (!v) return;
    const now = v.ctx.currentTime;
    const maxFreq = terms.reduce((m, t) => Math.max(m, t.freq), 0);
    // amp·sin(nωt + phase) = amp·cos(phase)·sin(nωt) + amp·sin(phase)·cos(nωt)
    const real = new Float32Array(maxFreq + 1);
    const imag = new Float32Array(maxFreq + 1);
    for (const { amp, freq, phase = 0 } of terms) {
      real[freq] += amp * Math.sin(phase);
      imag[freq] += amp * Math.cos(phase);
    }
    const silent = real.every((x) => x === 0) && imag.every((x) => x === 0);
    if (!silent) v.osc.setPeriodicWave(v.ctx.createPeriodicWave(real, imag));
    v.gain.gain.setTargetAtTime(on && !silent ? VOLUME : 0, now, SMOOTH);
  }, [terms, on]);

  useEffect(() => () => void voice.current?.ctx.close(), []);

  /* Browsers only let audio start from inside a click/tap handler, so the
     listen button calls this directly before turning sound on. */
  return function unlock() {
    if (!voice.current) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.frequency.value = BASE_HZ;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      voice.current = { ctx, osc, gain };
    }
    void voice.current.ctx.resume();
  };
}
