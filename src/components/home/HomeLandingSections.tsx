import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { MaterialReadingPathSection } from "@/components/home/MaterialReadingPathSection";
import { ParticipationCtaSection } from "@/components/home/ParticipationCtaSection";
import { ResearchTopicHubSection } from "@/components/home/ResearchTopicHubSection";
import { VideoContentSection } from "@/components/home/VideoContentSection";
import { PostType } from "@/generated/prisma/enums";
import { getMaterialArchiveItems } from "@/lib/material-guides";
import { getPublishedPosts } from "@/lib/posts";
import { connection } from "next/server";

export async function HomeLandingSections() {
  await connection();
  const materials = await getPublishedPosts(PostType.PROMOTION);
  const readingPath = getMaterialArchiveItems(materials).slice(0, 3);

  return (
    <div className="overflow-hidden bg-background">
      <HomeHeroSection />
      <ResearchTopicHubSection />
      <VideoContentSection />
      <MaterialReadingPathSection items={readingPath} />
      <ParticipationCtaSection />
    </div>
  );
}
