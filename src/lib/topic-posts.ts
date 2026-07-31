import { PostType } from "@/generated/prisma/enums";
import { getMaterialArchiveItems } from "@/lib/material-guides";
import { getPublishedPosts, type BoardPost } from "@/lib/posts";
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
    getPublishedPosts(PostType.NOTICE),
    getPublishedPosts(PostType.PROMOTION),
  ]);

  return {
    notices: filterByTopicCategory(notices, topic, PostType.NOTICE),
    materials: filterByTopicCategory(
      getMaterialArchiveItems(materials).map((item) => item.post),
      topic,
      PostType.PROMOTION,
    ),
  };
}

function filterByTopicCategory(
  posts: BoardPost[],
  topic: ResearchTopic,
  type: PostType,
) {
  const categorySlugs = topic.categoryConnections[type] ?? [];

  if (categorySlugs.length === 0) {
    return [];
  }

  return posts
    .filter((post) => categorySlugs.includes(post.categorySlug))
    .slice(0, relatedPostLimit);
}
