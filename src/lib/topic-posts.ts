import { PostType } from "@/generated/prisma/enums";
import { materialGuideSlugs } from "@/lib/material-guides";
import { getPublishedPostPreview, type BoardPost } from "@/lib/posts";
import type { ResearchTopic } from "@/lib/topics";

export type TopicRelatedPosts = {
  notices: BoardPost[];
  materials: BoardPost[];
};

const relatedPostLimit = 3;

export async function getTopicRelatedPosts(
  topic: ResearchTopic,
): Promise<TopicRelatedPosts> {
  const [notices, materials] = await Promise.all([
    getTopicPosts(topic, PostType.NOTICE),
    getTopicPosts(topic, PostType.PROMOTION),
  ]);

  return { notices, materials };
}

function getTopicPosts(
  topic: ResearchTopic,
  type: PostType,
) {
  const categorySlugs = topic.categoryConnections[type] ?? [];

  if (categorySlugs.length === 0) return [];

  return getPublishedPostPreview(type, {
    categorySlugs,
    ...(type === PostType.PROMOTION ? { slugs: materialGuideSlugs } : {}),
    take: relatedPostLimit,
  });
}
