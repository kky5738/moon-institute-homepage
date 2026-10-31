import { readFileSync } from "node:fs";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { LifeTimelineEventList } from "@/components/home/LifeTimelineEventList";
import { LifeTimelineSection } from "@/components/home/LifeTimelineSection";
import { MaterialReadingPathSection } from "@/components/home/MaterialReadingPathSection";
import { ParticipationCtaSection } from "@/components/home/ParticipationCtaSection";
import { ResearchTopicHubSection } from "@/components/home/ResearchTopicHubSection";
import { VideoContentSection } from "@/components/home/VideoContentSection";
import { PostType } from "@/generated/prisma/enums";
import {
  getMaterialArchiveItems,
  materialGuideSlugs,
} from "@/lib/material-guides";
import { parseLifeEventsCsv } from "@/lib/life-events";
import { getPublishedPostPreview } from "@/lib/posts";

export async function HomeLandingSections() {
  const materials = await getPublishedPostPreview(PostType.PROMOTION, {
    slugs: materialGuideSlugs,
    take: 3,
  });
  const readingPath = getMaterialArchiveItems(materials).slice(0, 3);
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
      <ResearchTopicHubSection />
      <VideoContentSection />
      <MaterialReadingPathSection items={readingPath} />
      <ParticipationCtaSection />
    </div>
  );
}
