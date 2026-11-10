import { homeIntroduction } from "@/lib/site-content";
import { HomeIntroductionContent } from "./HomeIntroductionContent";
import styles from "./HomeIntroductionSection.module.css";

export function HomeIntroductionSection() {
  return (
    <section id="home-introduction" className={styles.introduction}>
      <HomeIntroductionContent
        image={homeIntroduction.image}
        imageWidth={homeIntroduction.image.width}
        imageHeight={homeIntroduction.image.height}
        message={homeIntroduction.message}
        altText={homeIntroduction.alt}
      />
    </section>
  );
}
