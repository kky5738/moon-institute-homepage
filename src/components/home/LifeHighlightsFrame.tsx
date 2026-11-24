"use client";

import { Children, useId, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { highlightSwipe, nextHighlight } from "@/lib/life-highlight-navigation";
import styles from "@/components/life/life.module.css";

export function LifeHighlightsFrame({ children, preparing = false }: { children: ReactNode; preparing?: boolean }) {
  const cards = Children.toArray(children);
  const count = cards.length;
  const [selected, setSelected] = useState(0);
  const active = nextHighlight(selected, 0, count);
  const track = useRef<HTMLOListElement>(null);
  const animation = useRef<Animation | null>(null);
  const gesture = useRef<{ id: number; x: number; y: number; horizontal: boolean } | null>(null);
  const suppressClick = useRef(false);
  const id = useId();

  function move(direction: number) {
    if (count < 2) return;
    // Functional updates keep every button press, including presses during a fade.
    setSelected(index => nextHighlight(index, direction, count));
    animation.current?.cancel();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animation.current = track.current?.animate([{ opacity: .65 }, { opacity: 1 }], {
        duration: 140, easing: "ease-out",
      }) ?? null;
    }
  }

  function start(event: PointerEvent<HTMLDivElement>) {
    if (count < 2 || !event.isPrimary || event.button !== 0) return;
    animation.current?.cancel();
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.horizontal && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
      gesture.current = null;
      return;
    }
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      start.horizontal = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (start.horizontal && track.current) {
      // Limit dragging to one card; the gesture always advances at most one record.
      const limit = event.currentTarget.clientWidth * .6;
      track.current.style.translate = `${Math.max(-limit, Math.min(limit, dx))}px`;
    }
  }

  function finish(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    gesture.current = null;
    if (track.current) track.current.style.translate = "";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && start.horizontal) {
      const direction = highlightSwipe(event.clientX - start.x, event.clientY - start.y);
      if (direction) {
        // A card link under the gesture must not retain focus when it becomes hidden.
        if (track.current?.contains(document.activeElement)) event.currentTarget.focus({ preventScroll: true });
        move(direction);
      }
    }
  }

  if (!count) return null;
  const slots = count === 1 ? [active] : [nextHighlight(active, -1, count), active, nextHighlight(active, 1, count)];
  return <div>
    <div id={id} tabIndex={-1} className={styles.cardViewport} aria-roledescription="캐러셀" aria-label="대표 생애 기록"
      onPointerDown={start} onPointerMove={drag} onPointerUp={event => finish(event)}
      onPointerCancel={event => finish(event, true)} onLostPointerCapture={event => { if (event.target === event.currentTarget) finish(event, true); }}
      onDragStart={event => event.preventDefault()}
      onClickCapture={event => {
        if (event.detail === 0) return;
        if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); }
        suppressClick.current = false;
      }}>
      <ol ref={track} className={styles.highlightCards}>
        {slots.map((index, slot) => {
          const hidden = preparing || (count > 1 && slot !== 1);
          return <li key={slot} inert={hidden} aria-hidden={hidden || undefined}>{cards[index]}</li>;
        })}
      </ol>
    </div>
    {count > 1 && <div className={styles.highlightControls}>
      <button type="button" aria-label="이전 기록" aria-controls={id} onClick={() => move(-1)}>←</button>
      <p aria-live="polite" aria-atomic="true"><span className="sr-only">현재 기록 </span>{active + 1} / {count}</p>
      <button type="button" aria-label="다음 기록" aria-controls={id} onClick={() => move(1)}>→</button>
    </div>}
  </div>;
}
