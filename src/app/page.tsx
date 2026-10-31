import { HomeLandingSections } from "@/components/home/HomeLandingSections";
import { HomeIntroductionSection } from "@/components/home/HomeIntroductionSection";
import { FoundingManifestoSection } from "@/components/home/FoundingManifestoSection";

export default function Home() {
  return (
    <>
      <HomeIntroductionSection />
      <FoundingManifestoSection />
      <HomeLandingSections />
    </>
  );
}
