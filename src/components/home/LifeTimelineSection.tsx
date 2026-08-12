"use client";

import { useMemo, useState } from "react";
import {
  formatLifeEventDate,
  layoutLifeEvents,
  type LifeEvent,
} from "@/lib/life-events";

const chartSide = 30;
const chartWidth = 940;
const firstLaneY = 64;
const laneGap = 28;

export function LifeTimelineSection({ events }: { events: LifeEvent[] }) {
  const timeline = useMemo(() => layoutLifeEvents(events), [events]);
  const [selectedId, setSelectedId] = useState(timeline.events[0]?.id ?? "");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const selected =
    timeline.events.find((event) => event.id === selectedId) ?? timeline.events[0];
  const active =
    timeline.events.find((event) => event.id === previewId) ?? selected;
  const axisY = firstLaneY + timeline.laneCount * laneGap + 28;
  const chartHeight = axisY + 68;

  if (!selected) {
    return null;
  }

  return (
    <section
      id="life-timeline"
      aria-labelledby="life-timeline-title"
      className="life-timeline-paper scroll-mt-16 border-b border-border py-12 sm:py-16"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-purple">
              Life Archive
            </span>
            <h2
              id="life-timeline-title"
              className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em] text-foreground [word-break:keep-all] sm:text-4xl"
            >
              생애의 흐름
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              연도별 기록의 점을 선택하면 날짜와 내용을 확인할 수 있습니다.
            </p>
          </div>
          <p className="text-sm font-semibold text-primary-dark">
            표본 기록 {timeline.events.length}건 · {timeline.years[0]}–
            {timeline.years.at(-1)}
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-gold/35 bg-white/70 shadow-[var(--shadow-elegant)]">
          <p className="border-b border-gold/25 px-5 py-3 text-xs text-muted-foreground sm:px-6">
            모바일에서는 그래프를 좌우로 밀어 전체 연도를 살펴볼 수 있습니다.
          </p>

          <div className="overflow-x-auto overscroll-x-contain">
            <div
              className="relative min-w-[70rem]"
              style={{ height: `${chartHeight}px` }}
            >
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                viewBox={`0 0 1000 ${chartHeight}`}
              >
                <line
                  x1={chartSide}
                  x2={chartSide + chartWidth}
                  y1={axisY}
                  y2={axisY}
                  stroke="var(--gold)"
                  strokeWidth="1.5"
                />

                {timeline.years.map((year, index) => {
                  const x =
                    chartSide +
                    (index / Math.max(timeline.years.length, 1)) * chartWidth;

                  return (
                    <g key={year}>
                      <line
                        x1={x}
                        x2={x}
                        y1={axisY}
                        y2={axisY + 10}
                        stroke="var(--gold)"
                      />
                      <text
                        x={x}
                        y={axisY + 34}
                        fill="var(--primary-dark)"
                        fontSize="13"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {year}
                      </text>
                    </g>
                  );
                })}

                {timeline.events.map((event) => {
                  const x = chartSide + event.position * chartWidth;
                  const y = firstLaneY + event.lane * laneGap;

                  return (
                    <line
                      key={event.id}
                      x1={x}
                      x2={x}
                      y1={y + 7}
                      y2={axisY}
                      stroke="var(--gold)"
                      strokeOpacity="0.28"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>

              {timeline.events.map((event) => {
                const isSelected = event.id === selected.id;
                const y = firstLaneY + event.lane * laneGap;

                return (
                  <button
                    key={event.id}
                    type="button"
                    aria-label={`${formatLifeEventDate(event.date)} ${event.title}`}
                    aria-pressed={isSelected}
                    data-timeline-event="true"
                    onBlur={() => setPreviewId(null)}
                    onClick={() => setSelectedId(event.id)}
                    onFocus={() => setPreviewId(event.id)}
                    onKeyDown={(keyboardEvent) => {
                      if (keyboardEvent.key === "Enter") {
                        setSelectedId(event.id);
                      }
                    }}
                    onMouseEnter={() => setPreviewId(event.id)}
                    onMouseLeave={() => setPreviewId(null)}
                    className="group absolute grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-transform active:scale-90"
                    style={{
                      left: `${3 + event.position * 94}%`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "grid h-4 w-4 place-items-center rounded-full border bg-[#fcfaf4] transition-[box-shadow,background-color,border-color]",
                        isSelected
                          ? "border-gold bg-gold shadow-[0_0_0_6px_color-mix(in_oklab,var(--accent-purple)_20%,transparent)]"
                          : "border-accent-purple group-hover:bg-secondary group-focus-visible:bg-secondary",
                      ].join(" ")}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                  </button>
                );
              })}

              {active ? (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute z-10 w-72 rounded-lg border border-gold/45 bg-white px-4 py-3 text-left shadow-[var(--shadow-elegant)]"
                  style={{
                    left: `${Math.max(15, Math.min(85, 3 + active.position * 94))}%`,
                    top: `${
                      firstLaneY +
                      active.lane * laneGap +
                      (active.lane < 3 ? 24 : -16)
                    }px`,
                    transform:
                      active.lane < 3
                        ? "translate(-50%, 0)"
                        : "translate(-50%, -100%)",
                  }}
                >
                  <p className="text-xs font-semibold text-gold">
                    {formatLifeEventDate(active.date)}
                  </p>
                  <p className="mt-1 max-h-12 overflow-hidden text-sm font-semibold leading-6 text-foreground">
                    {active.title}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <article
            aria-live="polite"
            className="grid gap-5 border-t border-gold/30 bg-[#fffdf8] px-5 py-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:px-8 sm:py-8"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-purple">
                선택한 사건
              </p>
              <p className="mt-2 font-serif text-3xl text-primary-dark sm:text-4xl">
                {formatLifeEventDate(selected.date)}
              </p>
            </div>
            <div className="border-gold/35 sm:border-l sm:pl-8">
              <h3 className="text-lg font-semibold leading-7 text-foreground [word-break:keep-all] sm:text-xl">
                {selected.title}
              </h3>
              {selected.content ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                  {selected.content}
                </p>
              ) : null}
            </div>
          </article>
        </div>

        <details className="mt-4 rounded-lg border border-border bg-white/65 px-4 py-3 text-sm sm:px-5">
          <summary className="cursor-pointer font-semibold text-primary-dark">
            연대순 전체 목록 보기 ({timeline.events.length}건)
          </summary>
          <ol className="mt-4 max-h-80 space-y-3 overflow-y-auto border-t border-border pt-4">
            {timeline.events.map((event) => (
              <li key={event.id} className="grid gap-1 sm:grid-cols-[7rem_1fr]">
                <time className="font-semibold text-accent-purple">
                  {formatLifeEventDate(event.date)}
                </time>
                <span className="leading-6 text-foreground">{event.title}</span>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </section>
  );
}
