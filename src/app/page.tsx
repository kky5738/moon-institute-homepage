import { HomeLandingSections } from "@/components/home/HomeLandingSections";
import { HomeIntroductionSection } from "@/components/home/HomeIntroductionSection";
import { FoundingManifestoSection } from "@/components/home/FoundingManifestoSection";

export default function Home() {
  return (
    <>
      <HomeIntroductionSection />
      <FoundingManifestoSection />
      <div id="home-content" tabIndex={-1}>
        <Suspense fallback={<p role="status" className="min-h-[100svh] bg-background px-5 py-24 text-center">홈페이지를 불러오는 중입니다.</p>}>
          <HomeLandingSections />
        </Suspense>
      </div>
    </>
  );
}
import { Suspense } from "react";
