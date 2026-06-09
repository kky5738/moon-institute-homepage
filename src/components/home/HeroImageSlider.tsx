"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/images/home/img1.jpg",
  },
  {
    src: "/images/home/img2.jpg",
  },
  {
    src: "/images/home/img3.jpg",
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

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#2f234a,#4c3a7a_52%,#6d5ca5)]" />
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        const hasFailed = failedImages.has(slide.src);

        return (
          <div
            key={slide.src}
            aria-hidden={!isActive}
            className={[
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              isActive ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            {!hasFailed ? (
              <Image
                src={slide.src}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
                onError={() => {
                  setFailedImages((current) => new Set(current).add(slide.src));
                }}
              />
            ) : null}
          </div>
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/90 via-primary/72 to-accent-purple/58" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      <div className="absolute bottom-6 right-5 z-10 hidden items-center gap-2 sm:flex lg:right-10">
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
                "h-1.5 cursor-pointer rounded-full transition-all",
                isActive ? "w-10 bg-gold" : "w-6 bg-white/35 hover:bg-white/55",
              ].join(" ")}
            />
          );
        })}
      </div>
    </div>
  );
}

function getNextIndex(current: number) {
  return current === slides.length - 1 ? 0 : current + 1;
}
