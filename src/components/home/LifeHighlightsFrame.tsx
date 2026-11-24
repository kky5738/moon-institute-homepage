"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "@/components/life/life.module.css";

export function LifeHighlightsFrame({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    function position() {
      const frame = viewport.current;
      const card = frame?.querySelector<HTMLElement>("li:nth-child(2)");
      if (frame) frame.scrollLeft = !media.matches && card
        ? card.offsetLeft - (frame.clientWidth - card.offsetWidth) / 2 : 0;
    }
    position();
    const observer = new ResizeObserver(position);
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [children]);

  return <div ref={viewport} className={styles.cardViewport}>
    <ol className={styles.highlightCards}>{children}</ol>
  </div>;
}
