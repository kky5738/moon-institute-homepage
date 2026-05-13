import { PostStatus, PostType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type BoardPost = {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  publishedAt: string;
  isPinned: boolean;
};

export async function getPublishedPosts(type: PostType): Promise<BoardPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      type,
      status: PostStatus.PUBLISHED,
      deletedAt: null,
    },
    include: {
      category: true,
    },
    orderBy: [
      { isPinned: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category?.name ?? getDefaultCategoryName(post.type),
    summary: post.summary ?? post.content.slice(0, 120),
    publishedAt: formatDate(post.publishedAt ?? post.createdAt),
    isPinned: post.isPinned,
  }));
}

export async function getPinnedNotice(): Promise<BoardPost | null> {
  const posts = await getPublishedPosts(PostType.NOTICE);
  return posts.find((post) => post.isPinned) ?? posts[0] ?? null;
}

function getDefaultCategoryName(type: PostType) {
  if (type === PostType.NOTICE) {
    return "공지";
  }

  return "홍보자료";
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
