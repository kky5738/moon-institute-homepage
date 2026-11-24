import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { HomeDiscoverySections } from "@/components/home/HomeDiscoverySections";
import { HomeLifeHighlights } from "@/components/home/LifeHighlightsSection";
import { ParticipationCtaSection } from "@/components/home/ParticipationCtaSection";
import { homeDiscoveryEnabled } from "@/lib/home-discovery";

export function HomeLandingSections() {
  return (
    <div className="overflow-hidden bg-background">
      <HomeHeroSection />
      <HomeLifeHighlights />
      {homeDiscoveryEnabled && <HomeDiscoverySections />}
      <ParticipationCtaSection />
    </div>
  );
}
