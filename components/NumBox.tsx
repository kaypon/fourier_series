"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type NumBoxProps = {
  value: number;
  display: string;
  /** Value after dragging `delta` px (right/up positive) from `start`. */
  scrub: (start: number, delta: number) => number;
  /** Value after one arrow-key nudge in `dir` (+1/−1). */
  nudge: (value: number, dir: 1 | -1) => number;
  parse: (text: string) => number | null;
  onChange: (value: number) => void;
  onActive: (active: boolean) => void;
  label: string;
  /** Extra class, e.g. the dashed angle box. */
  className?: string;
};

const DRAG_THRESHOLD = 4;

/* One editable number in the formula. Drag it to scrub (sideways with a
   mouse; up/down on touch, so sideways swipes still scroll the formula),
   or click/tap it to type a value. */
export function NumBox({
  value,
  display,
  scrub,
  nudge,
  parse,
  onChange,
  onActive,
  label,
  className = "",
}: NumBoxProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const drag = useRef<{ x: number; y: number; start: number; moved: boolean } | null>(null);
  // Escape unmounts the input, and some browsers blur it on the way out —
  // don't let that blur commit the draft.
  const cancelled = useRef(false);

  const startEditing = () => {
    cancelled.current = false;
    setDraft(display);
    setEditing(true);
  };

  const commit = () => {
    const parsed = cancelled.current ? null : parse(draft);
    if (parsed !== null) onChange(parsed);
    setEditing(false);
    onActive(false);
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: value, moved: false };
    onActive(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    const delta = e.pointerType === "touch" ? -dy : dx - dy;
    onChange(scrub(d.start, delta));
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) startEditing();
    else onActive(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      onChange(nudge(value, 1));
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(nudge(value, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      startEditing();
    }
  };

  if (editing) {
    return (
      <input
        className={`num num--editing ${className}`}
        aria-label={label}
        value={draft}
        size={Math.max(2, draft.length)}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            cancelled.current = true;
            setEditing(false);
            onActive(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className={`num ${className}`}
      aria-label={`${label}: ${display}. Drag or use arrow keys to change, Enter to type.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
        onActive(false);
      }}
      onKeyDown={onKeyDown}
      onFocus={() => onActive(true)}
      onBlur={() => onActive(false)}
    >
      {display}
    </button>
  );
}
