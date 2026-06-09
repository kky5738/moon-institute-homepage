import { PostPhase, PostStatus, PostType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { isPrismaMissingTableError, logServerError } from "@/lib/server-log";

export type BoardPost = {
  id: number;
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  summary: string;
  publishedAt: string;
  isPinned: boolean;
  phase: string;
};

export type BoardPostDetail = BoardPost & {
  content: string;
};

export async function getPublishedPosts(type: PostType): Promise<BoardPost[]> {
  try {
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
      categorySlug: post.category?.slug ?? getDefaultCategorySlug(post.type),
      summary: post.summary ?? post.content.slice(0, 120),
      publishedAt: formatDate(post.publishedAt ?? post.createdAt),
      isPinned: post.isPinned,
      phase: getPhaseLabel(post.phase),
    }));
  } catch (error) {
    logServerError("posts.getPublishedPosts", error, { type });

    if (isPrismaMissingTableError(error)) {
      console.error(
        "[server-error] posts table is missing. Run `npm run db:deploy` against the production database.",
      );
      return [];
    }

    throw error;
  }
}

export async function getPublishedPostBySlug(
  type: PostType,
  slug: string,
): Promise<BoardPostDetail | null> {
  try {
    const post = await prisma.post.findFirst({
      where: {
        slug,
        type,
        status: PostStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        category: true,
      },
    });

    if (!post) {
      return null;
    }

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: post.category?.name ?? getDefaultCategoryName(post.type),
      categorySlug: post.category?.slug ?? getDefaultCategorySlug(post.type),
      summary: post.summary ?? post.content.slice(0, 120),
      content: post.content,
      publishedAt: formatDate(post.publishedAt ?? post.createdAt),
      isPinned: post.isPinned,
      phase: getPhaseLabel(post.phase),
    };
  } catch (error) {
    logServerError("posts.getPublishedPostBySlug", error, { type, slug });

    if (isPrismaMissingTableError(error)) {
      console.error(
        "[server-error] posts table is missing. Run `npm run db:deploy` against the production database.",
      );
      return null;
    }

    throw error;
  }
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

function getDefaultCategorySlug(type: PostType) {
  if (type === PostType.NOTICE) {
    return "notice";
  }

  return "promotion";
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPhaseLabel(phase: PostPhase) {
  if (phase === PostPhase.OFFICIAL) {
    return "출범 후";
  }

  return "출범 전";
}
