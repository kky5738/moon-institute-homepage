import { ActivityArchiveSection } from "@/components/home/ActivityArchiveSection";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { ParticipationCtaSection } from "@/components/home/ParticipationCtaSection";
import { VideoContentSection } from "@/components/home/VideoContentSection";

export function HomeLandingSections() {
  return (
    <div className="overflow-hidden bg-background">
      <HomeHeroSection />
      <VideoContentSection />
      <ActivityArchiveSection />
      <ParticipationCtaSection />
    </div>
  );
}
