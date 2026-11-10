"use client";

import { useEffect, useRef, useState } from "react";
import { HomeIntroductionContent, type HomeIntroductionVisual } from "@/components/home/HomeIntroductionContent";

const viewports = {
  pc: { width: 1280, height: 720, label: "PC" },
  mobile: { width: 390, height: 844, label: "모바일" },
};

export function HomeIntroductionPreview(props: HomeIntroductionVisual) {
  const [mode, setMode] = useState<keyof typeof viewports>("pc");
  const [availableWidth, setAvailableWidth] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const viewport = viewports[mode];
  const scale = Math.min(1, availableWidth / viewport.width);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-labelledby="preview-title" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="preview-title" className="text-lg font-semibold">실제 배치 미리보기</h2>
        <div role="group" aria-label="미리보기 화면 크기" className="flex gap-2">
          {(Object.keys(viewports) as Array<keyof typeof viewports>).map((key) => (
            <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)}
              className="border border-border px-3 py-2 text-sm font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-white">
              {viewports[key].label}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-4 mt-2 text-sm text-muted">{viewport.width} × {viewport.height}px 화면을 공간에 맞춰 축소한 모습입니다.</p>
      <div ref={container} className="w-full overflow-hidden border border-border bg-surface-alt p-3">
        <div className="relative mx-auto overflow-hidden bg-black" style={{ width: viewport.width * scale, height: viewport.height * scale }}>
          <div style={{ width: viewport.width, height: viewport.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <HomeIntroductionContent {...props} />
          </div>
        </div>
      </div>
    </section>
  );
}
