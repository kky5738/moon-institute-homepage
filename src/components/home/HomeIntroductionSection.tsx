import Image from "next/image";
import { homeIntroduction } from "@/lib/site-content";
import styles from "./HomeIntroductionSection.module.css";

export function HomeIntroductionSection() {
  return (
    <section id="home-introduction" className={`${styles.introduction} bg-black px-5 pb-12 pt-24 text-center text-white`}>
      <div className={styles.imageSpace}>
        <div
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
          />
        </div>
      </div>
      <p className="text-xl font-semibold leading-relaxed [overflow-wrap:anywhere] [word-break:keep-all] sm:text-2xl">
        {homeIntroduction.message}
      </p>
    </section>
  );
}
