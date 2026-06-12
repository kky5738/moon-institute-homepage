"use client";

import Image from "next/image";
import { useState } from "react";

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

export function HeroImageSlider({ activeIndex }: { activeIndex: number }) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const normalizedActiveIndex = activeIndex % slides.length;

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#2f234a,#4c3a7a_52%,#6d5ca5)]" />
      {slides.map((slide, index) => {
        const isActive = index === normalizedActiveIndex;
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
    </div>
  );
}
