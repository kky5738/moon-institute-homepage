"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/images/home/img1.jpg",
    alt: "문선명 연구소 소개를 위한 대표 이미지",
  },
  {
    src: "/images/home/img2.jpg",
    alt: "문선명 연구소 공지와 자료 공유를 상징하는 이미지",
  },
  {
    src: "/images/home/img3.jpg",
    alt: "문선명 연구소 문의와 참여 안내를 위한 대표 이미지",
  },
];

const slideIntervalMs = 4500;

export function HeroImageSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => getNextIndex(current));
    }, slideIntervalMs);

    return () => window.clearInterval(timer);
  }, []);

  const currentNumber = activeIndex + 1;

  return (
    <div className="border border-neutral-200 bg-stone-100">
      <div className="relative aspect-[16/9] min-h-[220px] overflow-hidden bg-neutral-200 sm:min-h-[320px] lg:min-h-[420px]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#e7e5e4,#f5f5f4)]" />
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          const hasFailed = failedImages.has(slide.src);

          return (
            <div
              key={slide.src}
              aria-hidden={!isActive}
              className={[
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                isActive ? "opacity-100" : "opacity-0",
              ].join(" ")}
            >
              {!hasFailed ? (
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 1120px"
                  className="object-cover"
                  onError={() => {
                    setFailedImages((current) => new Set(current).add(slide.src));
                  }}
                />
              ) : null}
            </div>
          );
        })}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/20 via-transparent to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-4 sm:p-5">
          <p className="bg-white/85 px-3 py-1.5 text-xs font-semibold text-neutral-700">
            대표 이미지 {currentNumber} / {slides.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="이전 이미지 보기"
              onClick={() => setActiveIndex((current) => getPreviousIndex(current))}
              className="flex h-9 w-9 cursor-pointer items-center justify-center border border-white/70 bg-white/85 text-lg font-semibold text-neutral-800 hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="다음 이미지 보기"
              onClick={() => setActiveIndex((current) => getNextIndex(current))}
              className="flex h-9 w-9 cursor-pointer items-center justify-center border border-white/70 bg-white/85 text-lg font-semibold text-neutral-800 hover:bg-white"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 bg-white px-4 py-3">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={slide.src}
              type="button"
              aria-label={`${index + 1}번째 대표 이미지 보기`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
              className={[
                "h-2.5 w-2.5 cursor-pointer border border-neutral-500 transition-colors",
                isActive ? "bg-neutral-800" : "bg-white hover:bg-neutral-200",
              ].join(" ")}
            />
          );
        })}
      </div>
    </div>
  );
}

function getPreviousIndex(current: number) {
  return current === 0 ? slides.length - 1 : current - 1;
}

function getNextIndex(current: number) {
  return current === slides.length - 1 ? 0 : current + 1;
}
