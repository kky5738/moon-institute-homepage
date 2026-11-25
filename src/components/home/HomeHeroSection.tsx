"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeroImageSlider } from "@/components/home/HeroImageSlider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { heroSlides } from "@/lib/site-content";

const slideIntervalMs = 6000;

export function HomeHeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeSlide = heroSlides[activeIndex];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => getNextIndex(current));
    }, slideIntervalMs);

    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  return (
    <section id="top" className="relative min-h-[100svh] scroll-mt-16 overflow-hidden bg-primary-dark text-white">
      <HeroImageSlider activeIndex={activeIndex} />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-between px-5 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:px-10 lg:pb-8 lg:pt-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
            <span className="h-px w-8 bg-gold" aria-hidden="true" />
            홈페이지 개설 안내
          </span>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-white [word-break:keep-all] sm:text-5xl lg:text-5xl">
            문선명 연구소 홈페이지가 첫걸음을 내딛습니다
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/78 [word-break:keep-all] sm:text-lg sm:leading-8">
            이제 막 문을 연 홈페이지에는 아직 채워 나갈 부분이 많습니다.
            자료와 소식을 차근차근 더하고, 더 편리하게 이용하실 수 있도록 다듬겠습니다.
            앞으로 발전하고 변화해 갈 모습을 기대해 주세요.
          </p>
        </div>

        <div className="mt-7 flex justify-end">
          <div className="w-full max-w-2xl">
            <Card
              key={activeSlide.title}
              className="bg-white/95 p-4 text-foreground shadow-[var(--shadow-elegant)] backdrop-blur sm:p-6 lg:p-6 xl:p-7"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="secondary">{activeSlide.label}</Badge>
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
                  className={buttonVariants()}
                >
                  {activeSlide.ctaLabel} <span className="ml-2" aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/materials"
                  className={buttonVariants({ variant: "ghost" })}
                >
                  자료 아카이브
                </Link>
              </div>
            </Card>

            <div
              className="mt-4 flex items-center gap-2"
              aria-label="연구 주제 슬라이드 위치"
              role="group"
            >
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  aria-label={`${slide.title} 연구 주제 보기`}
                  aria-pressed={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                  className="group grid h-11 w-11 cursor-pointer place-items-center rounded-full"
                >
                  <span
                    aria-hidden="true"
                    className={[
                      "h-1.5 rounded-full transition-all",
                      index === activeIndex
                        ? "w-8 bg-gold"
                        : "w-6 bg-white/35 group-hover:bg-white/55",
                    ].join(" ")}
                  />
                </button>
              ))}
              <button
                type="button"
                disabled={prefersReducedMotion}
                onClick={() => setIsPaused((current) => !current)}
                className="min-h-11 rounded-full border border-white/35 px-3 text-xs font-semibold text-white hover:bg-white/10 active:bg-white/20 disabled:hover:bg-transparent disabled:active:bg-transparent disabled:opacity-70"
              >
                {prefersReducedMotion
                  ? "자동 전환 꺼짐"
                  : isPaused
                    ? "자동 전환 시작"
                    : "자동 전환 멈춤"}
              </button>
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
