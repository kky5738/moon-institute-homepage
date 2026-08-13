"use client";

import { useMemo, useState } from "react";
import {
  formatLifeEventDate,
  getYearTicks,
  groupLifeEventsByYear,
  layoutLifeEvents,
  type LifeEvent,
} from "@/lib/life-events";

const chartSide = 30;
const chartWidth = 940;
const firstLaneY = 64;
const laneGap = 28;
const overviewAxisY = 150;
const months = Array.from({ length: 12 }, (_, index) => index + 1);

export function LifeTimelineSection({ events }: { events: LifeEvent[] }) {
  const fullTimeline = useMemo(() => layoutLifeEvents(events), [events]);
  const yearGroups = useMemo(() => groupLifeEventsByYear(events), [events]);
  const yearTicks = useMemo(
    () => getYearTicks(fullTimeline.years),
    [fullTimeline.years],
  );
  const [zoomYear, setZoomYear] = useState<number | null>(null);
  const [lastZoomYear, setLastZoomYear] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState(
    fullTimeline.events[0]?.id ?? "",
  );
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewYear, setPreviewYear] = useState<number | null>(null);
  const detailTimeline = useMemo(
    () =>
      zoomYear === null
        ? null
        : layoutLifeEvents(events, 0.025, zoomYear),
    [events, zoomYear],
  );
  const selected =
    detailTimeline?.events.find((event) => event.id === selectedId) ??
    detailTimeline?.events[0];
  const active =
    detailTimeline?.events.find((event) => event.id === previewId) ?? selected;
  const isOverview = zoomYear === null;
  const axisY = isOverview
    ? overviewAxisY
    : Math.max(
        240,
        firstLaneY + (detailTimeline?.laneCount ?? 0) * laneGap + 28,
      );
  const chartHeight = axisY + 68;
  const firstYear = fullTimeline.years[0];
  const yearSpan = fullTimeline.years.length;

  if (yearGroups.length === 0) {
    return null;
  }

  function openYear(year: number) {
    setZoomYear(year);
    setLastZoomYear(year);
    setPreviewYear(null);
    setPreviewId(null);
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
              연도별 기록을 모아보고, 한 해를 확대해 월별 사건을 확인할 수
              있습니다.
            </p>
          </div>
          <p className="text-sm font-semibold text-primary-dark">
            표본 기록 {fullTimeline.events.length}건 · {firstYear}–
            {fullTimeline.years.at(-1)}
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-gold/35 bg-white/70 shadow-[var(--shadow-elegant)]">
          <div className="flex flex-col gap-3 border-b border-gold/25 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs leading-5 text-muted-foreground" aria-live="polite">
              {isOverview
                ? "숫자가 표시된 연도 점을 선택하면 월별 기록으로 확대됩니다."
                : `${zoomYear}년의 모든 사건을 월별로 표시하고 있습니다.`}
            </p>
            <label className="flex items-center gap-2 text-xs font-semibold text-primary-dark">
              보기 범위
              <select
                data-timeline-range="true"
                value={zoomYear ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value) {
                    openYear(Number(value));
                  } else {
                    setZoomYear(null);
                    setPreviewId(null);
                  }
                }}
                className="min-h-11 rounded-full border border-gold/40 bg-white px-4 text-sm font-semibold text-primary-dark outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <option value="">전체 연도 보기</option>
                {yearGroups.map((group) => (
                  <option key={group.year} value={group.year}>
                    {group.year}년 월별 상세
                  </option>
                ))}
              </select>
            </label>
          </div>

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

                {(isOverview ? yearTicks : months).map((tick) => {
                  const position = isOverview
                    ? (tick - firstYear) / yearSpan
                    : (tick - 1) / 12;
                  const x = chartSide + position * chartWidth;

                  return (
                    <g key={tick}>
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
                        {isOverview ? tick : `${tick}월`}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {isOverview
                ? yearGroups.map((group) => {
                    const position =
                      (group.year - firstYear + 0.5) / yearSpan;
                    const isCurrent = group.year === lastZoomYear;

                    return (
                      <button
                        key={group.year}
                        type="button"
                        aria-label={`${group.year}년 사건 ${group.events.length}건, 월별 상세 보기`}
                        data-timeline-cluster="true"
                        data-event-count={group.events.length}
                        onBlur={() => setPreviewYear(null)}
                        onClick={() => openYear(group.year)}
                        onFocus={() => setPreviewYear(group.year)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            openYear(group.year);
                          }
                        }}
                        onMouseEnter={() => setPreviewYear(group.year)}
                        onMouseLeave={() => setPreviewYear(null)}
                        className="group absolute grid h-12 w-12 cursor-pointer place-items-center rounded-full transition-transform active:scale-90"
                        style={{
                          left: `${3 + position * 94}%`,
                          top: `${firstLaneY}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          className={[
                            "grid h-9 min-w-9 place-items-center rounded-full border-2 bg-[#fcfaf4] px-2 text-sm font-bold text-primary shadow-sm transition-[box-shadow,background-color,border-color]",
                            isCurrent
                              ? "border-gold bg-secondary shadow-[0_0_0_5px_color-mix(in_oklab,var(--accent-purple)_16%,transparent)]"
                              : "border-accent-purple group-hover:bg-secondary group-focus-visible:bg-secondary",
                          ].join(" ")}
                        >
                          {group.events.length}
                        </span>
                      </button>
                    );
                  })
                : detailTimeline?.events.map((event) => {
                    const isSelected = event.id === selected?.id;
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
                            keyboardEvent.preventDefault();
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

              {isOverview && previewYear !== null ? (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute z-10 rounded-lg border border-gold/45 bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-elegant)]"
                  style={{
                    left: `${Math.max(
                      12,
                      Math.min(
                        88,
                        3 +
                          ((previewYear - firstYear + 0.5) / yearSpan) * 94,
                      ),
                    )}%`,
                    top: `${firstLaneY + 30}px`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {previewYear}년 · 사건 {yearGroups.find(
                    (group) => group.year === previewYear,
                  )?.events.length ?? 0}
                  건
                </div>
              ) : null}

              {!isOverview && active ? (
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

          {!isOverview && selected ? (
            <article
              aria-live="polite"
              className="grid gap-5 border-t border-gold/30 bg-[#fffdf8] px-5 py-6 sm:grid-cols-[13rem_minmax(0,1fr)] sm:px-8 sm:py-8"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-purple">
                  선택한 사건
                </p>
                <p className="mt-2 whitespace-nowrap font-serif text-3xl text-primary-dark sm:text-4xl">
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
          ) : null}
        </div>

        <details className="mt-4 rounded-lg border border-border bg-white/65 px-4 py-3 text-sm sm:px-5">
          <summary className="cursor-pointer font-semibold text-primary-dark">
            연대순 전체 목록 보기 ({fullTimeline.events.length}건)
          </summary>
          <ol className="mt-4 max-h-80 space-y-3 overflow-y-auto border-t border-border pt-4">
            {fullTimeline.events.map((event) => (
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
