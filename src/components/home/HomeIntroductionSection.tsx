import { Suspense } from "react";
import { connection } from "next/server";
import { getPublicHomeIntroduction } from "@/lib/home-introduction-public";
import { HomeIntroductionContent } from "./HomeIntroductionContent";
import styles from "./HomeIntroductionSection.module.css";

export function HomeIntroductionSection() {
  return (
    <section id="home-introduction" className={styles.introduction}>
      <Suspense fallback={<p role="status" className="grid h-full place-items-center bg-black px-5 text-white">첫 화면을 불러오는 중입니다.</p>}>
        <CurrentHomeIntroduction />
      </Suspense>
    </section>
  );
}

async function CurrentHomeIntroduction() {
  // Keep a failed lookup's default content out of the full-page prerender cache.
  await connection();
  const content = await getPublicHomeIntroduction();
  return <HomeIntroductionContent key={content.id} {...content} />;
}
