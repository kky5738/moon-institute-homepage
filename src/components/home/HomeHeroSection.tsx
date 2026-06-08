"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { heroSlides } from "@/lib/site-content";

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
    <section className="relative isolate min-h-[calc(100dvh-124px)] overflow-hidden bg-neutral-950 text-white sm:min-h-[calc(100dvh-73px)]">
      <div className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.title}
            className={[
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              index === activeIndex ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{ background: slide.background }}
            aria-hidden={index !== activeIndex}
          />
        ))}
        <div className="absolute inset-0 bg-neutral-950/60" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.68),rgba(0,0,0,0.28)_58%,rgba(0,0,0,0.12))]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-124px)] w-full max-w-screen-2xl flex-col justify-center px-5 py-10 sm:min-h-[calc(100dvh-73px)] sm:px-6 sm:py-14 lg:px-8 xl:px-10 2xl:px-12">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] xl:gap-14">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold text-[#e6e0f3]">
              문선명 연구소 홈페이지
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              주요 소식과 월간 흐름을 차분하게 전합니다
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#e6e0f3] sm:mt-6 sm:text-lg sm:leading-8 lg:max-w-3xl">
              출범 전 홍보 운영부터 공식 홈페이지 전환까지, 공지와 자료를
              보존하는 연구소의 공개 창구로 준비합니다.
            </p>
          </div>

          <div className="w-full max-w-2xl lg:max-w-none">
            <article className="border border-white/20 bg-neutral-950/55 p-5 shadow-2xl shadow-neutral-950/25 backdrop-blur sm:p-6 xl:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#e6e0f3]">
                  {activeSlide.label}
                </p>
                <span className="text-sm font-medium text-[#d8d0ee]">
                  {activeSlide.date}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                {activeSlide.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#e6e0f3]">
                {activeSlide.summary}
              </p>
              <Link
                href={activeSlide.href}
                className="mt-6 inline-flex min-h-11 items-center justify-center border border-white bg-white px-5 py-2 text-sm font-semibold text-primary-dark hover:bg-[#ede9f7]"
              >
                {activeSlide.ctaLabel}
              </Link>
            </article>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mt-8">
              <div
                className="flex items-center gap-3"
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
                      "h-1.5 cursor-pointer border border-white/40 transition-all",
                      index === activeIndex
                        ? "w-10 bg-white"
                        : "w-5 bg-white/20 hover:bg-white/50",
                    ].join(" ")}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="이전 주요 소식 보기"
                  onClick={() => setActiveIndex((current) => getPreviousIndex(current))}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center border border-white/35 bg-white/10 text-lg font-semibold text-white hover:bg-white/20"
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <button
                  type="button"
                  aria-label="다음 주요 소식 보기"
                  onClick={() => setActiveIndex((current) => getNextIndex(current))}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center border border-white/35 bg-white/10 text-lg font-semibold text-white hover:bg-white/20"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getPreviousIndex(current: number) {
  return current === 0 ? heroSlides.length - 1 : current - 1;
}

function getNextIndex(current: number) {
  return current === heroSlides.length - 1 ? 0 : current + 1;
}
