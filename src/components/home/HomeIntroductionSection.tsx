"use client";

import Image from "next/image";
import { useState } from "react";
import { homeIntroduction } from "@/lib/site-content";
import styles from "./HomeIntroductionSection.module.css";

export function HomeIntroductionSection() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section id="home-introduction" className={`${styles.introduction} bg-black px-5 pb-12 pt-24 text-center text-white`}>
      <div className={styles.imageSpace}>
        {imageFailed ? (
          <p role="status" className="absolute inset-0 grid place-items-center px-4 text-base text-white">
            이미지를 불러오지 못했습니다. 페이지를 새로고침해 주세요.
          </p>
        ) : <div
          className={styles.imageFrame}
          style={{
            width: `min(100cqw, calc(100cqh * ${homeIntroduction.image.width} / ${homeIntroduction.image.height}))`,
            aspectRatio: `${homeIntroduction.image.width} / ${homeIntroduction.image.height}`,
          }}
        >
          <Image
            src={homeIntroduction.image}
            alt=""
            aria-hidden="true"
            sizes="100vw"
            loading="eager"
            className={`${styles.image} ${styles.blurredImage}`}
          />
          <Image
            src={homeIntroduction.image}
            alt={homeIntroduction.alt}
            sizes="100vw"
            loading="eager"
            className={`${styles.image} ${styles.sharpImage}`}
            onError={() => setImageFailed(true)}
          />
        </div>}
      </div>
      <p className="text-xl font-semibold leading-relaxed [overflow-wrap:anywhere] [word-break:keep-all] sm:text-2xl">
        {homeIntroduction.message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-6">
        <a href="#founding-manifesto" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-white underline underline-offset-4 hover:text-white/75">
          창립선언문 보기 <span aria-hidden="true" className="ml-2">↓</span>
        </a>
        <a href="#home-content" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-white underline underline-offset-4 hover:text-white/75">
          홈페이지 바로가기 <span aria-hidden="true" className="ml-2">↓</span>
        </a>
      </div>
    </section>
  );
}
