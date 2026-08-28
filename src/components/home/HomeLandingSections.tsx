import { readFileSync } from "node:fs";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
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
      <LifeTimelineSection events={lifeEvents} />
      <ResearchTopicHubSection />
      <VideoContentSection />
      <MaterialReadingPathSection items={readingPath} />
      <ParticipationCtaSection />
    </div>
  );
}
