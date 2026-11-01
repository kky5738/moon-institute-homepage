import { MaterialReadingPathSection } from "@/components/home/MaterialReadingPathSection";
import { ResearchTopicHubSection } from "@/components/home/ResearchTopicHubSection";
import { VideoContentSection } from "@/components/home/VideoContentSection";
import { PostType } from "@/generated/prisma/enums";
import { getMaterialArchiveItems, materialGuideSlugs } from "@/lib/material-guides";
import { getPublishedPostPreview } from "@/lib/posts";

export async function HomeDiscoverySections() {
  const materials = await getPublishedPostPreview(PostType.PROMOTION, {
    slugs: materialGuideSlugs,
    take: 3,
  });
  const readingPath = getMaterialArchiveItems(materials).slice(0, 3);

  return (
    <>
      <ResearchTopicHubSection />
      <VideoContentSection />
      <MaterialReadingPathSection items={readingPath} />
    </>
  );
}
