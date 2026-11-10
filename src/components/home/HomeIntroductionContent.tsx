"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";
import styles from "./HomeIntroductionSection.module.css";

export type HomeIntroductionVisual = {
  image: StaticImageData | string;
  imageWidth: number;
  imageHeight: number;
  message: string;
  altText: string;
};

export function HomeIntroductionContent({ image, imageWidth, imageHeight, message, altText }: HomeIntroductionVisual) {
  const [failedImage, setFailedImage] = useState<StaticImageData | string | null>(null);

  return (
    <div className={styles.content}>
      <div className={styles.imageSpace}>
        {failedImage === image ? (
          <p role="status" className="absolute inset-0 grid place-items-center px-4 text-base text-white">
            이미지를 불러오지 못했습니다. 페이지를 새로고침해 주세요.
          </p>
        ) : <div
          className={styles.imageFrame}
          style={{
            width: `min(100cqw, calc(100cqh * ${imageWidth} / ${imageHeight}))`,
            aspectRatio: `${imageWidth} / ${imageHeight}`,
          }}
        >
          <Image
            src={image}
            width={imageWidth}
            height={imageHeight}
            alt=""
            aria-hidden="true"
            sizes="100vw"
            loading="eager"
            unoptimized={typeof image === "string"}
            className={`${styles.image} ${styles.blurredImage}`}
          />
          <Image
            src={image}
            width={imageWidth}
            height={imageHeight}
            alt={altText}
            sizes="100vw"
            loading="eager"
            unoptimized={typeof image === "string"}
            className={`${styles.image} ${styles.sharpImage}`}
            onError={() => setFailedImage(image)}
          />
        </div>}
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
