import { readFileSync } from "node:fs";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { HomeDiscoverySections } from "@/components/home/HomeDiscoverySections";
import { LifeTimelineEventList } from "@/components/home/LifeTimelineEventList";
import { LifeTimelineSection } from "@/components/home/LifeTimelineSection";
import { ParticipationCtaSection } from "@/components/home/ParticipationCtaSection";
import { homeDiscoveryEnabled } from "@/lib/home-discovery";
import { parseLifeEventsCsv } from "@/lib/life-events";

export function HomeLandingSections() {
  const lifeEvents = parseLifeEventsCsv(
    readFileSync("src/lib/sample life events.csv", "utf8"),
  );

  return (
    <div className="overflow-hidden bg-background">
      <HomeHeroSection />
      <section
        id="life-timeline"
        aria-labelledby="life-timeline-title"
        className="life-timeline-paper scroll-mt-16 border-b border-border py-12 sm:py-16"
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10">
          <LifeTimelineSection events={lifeEvents} />
          <LifeTimelineEventList events={lifeEvents} />
        </div>
      </section>
      {homeDiscoveryEnabled && <HomeDiscoverySections />}
      <ParticipationCtaSection />
    </div>
  );
}
