"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatLifeEventDate,
  getOverviewTimelineWidth,
  getYearTicks,
  groupLifeEventsByYear,
  layoutLifeEvents,
  type LifeEvent,
} from "@/lib/life-events";

const chartSide = 30;
const detailChartWidth = 1120;
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
  const timelineScrollerRef = useRef<HTMLDivElement>(null);
  const clusterRefs = useRef(new Map<number, HTMLButtonElement>());
  const firstEventRef = useRef<HTMLButtonElement>(null);
  const focusEventOnOpenRef = useRef(false);
  const focusClusterOnCloseRef = useRef(false);
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
  const zoomIndex = yearGroups.findIndex((group) => group.year === zoomYear);
  const zoomGroup = zoomIndex === -1 ? null : yearGroups[zoomIndex];
  const axisY = isOverview
    ? overviewAxisY
    : Math.max(
        240,
        firstLaneY + (detailTimeline?.laneCount ?? 0) * laneGap + 28,
      );
  const chartHeight = axisY + 68;
  const timelineWidth = isOverview
    ? getOverviewTimelineWidth(fullTimeline.years)
    : detailChartWidth;
  const plotWidth = timelineWidth - chartSide * 2;
  const firstYear = fullTimeline.years[0];
  const yearSpan = fullTimeline.years.length;

  useEffect(() => {
    if (zoomYear === null) {
      return;
    }

    if (timelineScrollerRef.current) {
      timelineScrollerRef.current.scrollLeft = 0;
    }
    if (focusEventOnOpenRef.current) {
      firstEventRef.current?.focus();
      focusEventOnOpenRef.current = false;
    }
  }, [zoomYear]);

  useEffect(() => {
    if (zoomYear !== null || lastZoomYear === null) {
      return;
    }

    const cluster = clusterRefs.current.get(lastZoomYear);
    const scroller = timelineScrollerRef.current;
    if (!cluster || !scroller) {
      return;
    }

    scroller.scrollLeft = Math.max(
      0,
      cluster.offsetLeft - scroller.clientWidth / 2 + cluster.offsetWidth / 2,
    );
    if (focusClusterOnCloseRef.current) {
      cluster.focus();
    }
    focusClusterOnCloseRef.current = false;
  }, [lastZoomYear, zoomYear]);

  if (yearGroups.length === 0) {
    return null;
  }

  function openYear(year: number, moveFocus = false) {
    focusEventOnOpenRef.current = moveFocus;
    setZoomYear(year);
    setLastZoomYear(year);
    setPreviewYear(null);
    setPreviewId(null);
  }

  function closeYear(moveFocus: boolean) {
    focusClusterOnCloseRef.current = moveFocus;
    setZoomYear(null);
    setPreviewId(null);
  }

  return (
    <>
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
          <div className="border-b border-gold/25 px-5 py-3 sm:px-6">
            {isOverview ? (
              <p
                className="text-xs leading-5 text-muted-foreground"
                aria-live="polite"
              >
                숫자가 표시된 연도 점을 선택하면 월별 기록으로 확대됩니다.
              </p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={(event) => closeYear(event.detail === 0)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      closeYear(true);
                    }
                  }}
                  className="min-h-11 rounded-full border border-gold/40 bg-white px-4 text-sm font-semibold text-primary-dark transition-colors hover:bg-secondary active:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  ← 전체 연도 보기
                </button>
                <p
                  className="text-sm font-semibold text-primary-dark"
                  aria-live="polite"
                >
                  {zoomYear}년 · 사건 {zoomGroup?.events.length ?? 0}건
                </p>
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="상세 연도 이동"
                >
                  <button
                    type="button"
                    disabled={zoomIndex <= 0}
                    onClick={() => openYear(yearGroups[zoomIndex - 1].year)}
                    className="min-h-11 rounded-full border border-gold/40 bg-white px-4 text-sm font-semibold text-primary-dark transition-colors hover:bg-secondary active:bg-secondary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    이전 연도
                  </button>
                  <button
                    type="button"
                    disabled={zoomIndex === yearGroups.length - 1}
                    onClick={() => openYear(yearGroups[zoomIndex + 1].year)}
                    className="min-h-11 rounded-full border border-gold/40 bg-white px-4 text-sm font-semibold text-primary-dark transition-colors hover:bg-secondary active:bg-secondary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    다음 연도
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            ref={timelineScrollerRef}
            data-timeline-scroller="true"
            className="overflow-x-auto overscroll-x-contain"
          >
            <div
              className="relative"
              style={{ height: `${chartHeight}px`, width: `${timelineWidth}px` }}
            >
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                viewBox={`0 0 ${timelineWidth} ${chartHeight}`}
              >
                <line
                  x1={chartSide}
                  x2={chartSide + plotWidth}
                  y1={axisY}
                  y2={axisY}
                  stroke="var(--gold)"
                  strokeWidth="1.5"
                />

                {(isOverview ? yearTicks : months).map((tick) => {
                  const position = isOverview
                    ? (tick - firstYear) / yearSpan
                    : (tick - 1) / 12;
                  const x = chartSide + position * plotWidth;

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
                        ref={(node) => {
                          if (node) {
                            clusterRefs.current.set(group.year, node);
                          } else {
                            clusterRefs.current.delete(group.year);
                          }
                        }}
                        type="button"
                        aria-label={`${group.year}년 사건 ${group.events.length}건, 월별 상세 보기`}
                        data-timeline-cluster="true"
                        data-event-count={group.events.length}
                        onBlur={() => setPreviewYear(null)}
                        onClick={(event) =>
                          openYear(group.year, event.detail === 0)
                        }
                        onFocus={() => setPreviewYear(group.year)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            openYear(group.year, true);
                          }
                        }}
                        onMouseEnter={() => setPreviewYear(group.year)}
                        onMouseLeave={() => setPreviewYear(null)}
                        className="group absolute grid h-12 w-12 cursor-pointer place-items-center rounded-full transition-transform active:scale-90"
                        style={{
                          left: `${chartSide + position * plotWidth}px`,
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
                : detailTimeline?.events.map((event, index) => {
                    const isSelected = event.id === selected?.id;
                    const y = firstLaneY + event.lane * laneGap;

                    return (
                      <button
                        key={event.id}
                        ref={index === 0 ? firstEventRef : undefined}
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
                          left: `${chartSide + event.position * plotWidth}px`,
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
                      100,
                      Math.min(
                        timelineWidth - 100,
                        chartSide +
                          ((previewYear - firstYear + 0.5) / yearSpan) *
                            plotWidth,
                      ),
                    )}px`,
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
                    left: `${Math.max(
                      180,
                      Math.min(
                        timelineWidth - 180,
                        chartSide + active.position * plotWidth,
                      ),
                    )}px`,
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

    </>
  );
}
