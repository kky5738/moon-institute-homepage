"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeroImageSlider } from "@/components/home/HeroImageSlider";
import { heroSlides, monthlyNewsItems } from "@/lib/site-content";

const slideIntervalMs = 6000;

export function HomeHeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = heroSlides[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => getNextIndex(current));
    }, slideIntervalMs);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section id="top" className="relative min-h-[100svh] scroll-mt-16 overflow-hidden bg-primary-dark text-white">
      <HeroImageSlider />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-between px-5 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:px-10 lg:pb-8 lg:pt-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
            <span className="h-px w-8 bg-gold" aria-hidden="true" />
            Moon Institute
          </span>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-white [word-break:keep-all] sm:text-5xl lg:text-5xl">
            주요 소식과 월간 흐름을 차분하게 전합니다
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/78 sm:text-lg sm:leading-8">
            출범 전 홍보 운영부터 공식 홈페이지 전환까지, 공지와 자료를
            보존하는 연구소의 공개 창구로 준비합니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/notices"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-primary-dark transition-colors hover:bg-gold"
            >
              공지 확인 <span className="ml-2" aria-hidden="true">→</span>
            </Link>
            <Link
              href="/materials"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/45 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              자료 보기
            </Link>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,41rem)] lg:items-end">
          <div className="grid auto-cols-[8.75rem] grid-flow-col gap-3 overflow-x-auto pb-1 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:max-w-xl">
            {monthlyNewsItems.map((item) => (
              <div
                key={item.label}
                className="min-h-20 rounded-lg border border-white/16 bg-white/10 p-3 backdrop-blur sm:p-4"
              >
                <p className="text-xl font-semibold text-gold sm:text-2xl">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-white/68">{item.label}</p>
              </div>
            ))}
          </div>

          <div>
            <article
              key={activeSlide.title}
              className="max-w-2xl rounded-lg bg-white/95 p-4 text-foreground shadow-[var(--shadow-elegant)] backdrop-blur sm:p-6 lg:p-6 xl:p-7"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary-dark">
                  {activeSlide.label}
                </span>
                <span>{activeSlide.date}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold leading-snug text-foreground [word-break:keep-all] sm:text-2xl">
                {activeSlide.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                {activeSlide.summary}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={activeSlide.href}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
                >
                  {activeSlide.ctaLabel} <span className="ml-2" aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/notices"
                  className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-primary-dark transition-colors hover:bg-secondary"
                >
                  전체 소식
                </Link>
              </div>
            </article>

            <div
              className="mt-4 flex items-center gap-2"
              aria-label="주요 소식 슬라이드 위치"
            >
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  aria-label={`${index + 1}번째 주요 소식 보기`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  onClick={() => setActiveIndex(index)}
                  className={[
                    "h-1.5 cursor-pointer rounded-full transition-all",
                    index === activeIndex
                      ? "w-10 bg-gold"
                      : "w-6 bg-white/35 hover:bg-white/55",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getNextIndex(current: number) {
  return current === heroSlides.length - 1 ? 0 : current + 1;
}
