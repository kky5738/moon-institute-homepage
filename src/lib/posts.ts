import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { AttachmentKind, PostStatus, PostType } from "@/generated/prisma/enums";
import { getPostPageWindow, POSTS_PER_PAGE } from "@/lib/pagination";
import { decodePostSlug } from "@/lib/post-slug";
import { prisma } from "@/lib/prisma";
import { isPrismaMissingTableError, logServerError } from "@/lib/server-log";
import { createResearchFileUrls } from "@/lib/supabase-storage";

const hiddenPublicPostSlugs = ["institute-introduction-material"];

export function getPublishedPostsCacheTag(type: PostType) {
  return `published-posts:${type}`;
}

export type BoardPost = {
  id: number;
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  summary: string;
  publishedAt: string;
  isPinned: boolean;
  authorName: string | null;
  attachmentCount: number;
};

export type BoardPostDetail = BoardPost & {
  content: string;
  authorId: number | null;
  attachments: Array<{
    id: string;
    kind: AttachmentKind;
    originalName: string;
    contentType: string;
    size: number;
    altText: string | null;
    imageWidth: number | null;
    imageHeight: number | null;
    url: string | null;
  }>;
};

type PublishedPostFilters = {
  slugs?: string[];
  categorySlugs?: string[];
};

const boardPostSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  type: true,
  isPinned: true,
  publishedAt: true,
  createdAt: true,
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
  author: {
    select: {
      name: true,
    },
  },
  _count: {
    select: {
      attachments: {
        where: {
          kind: AttachmentKind.ATTACHMENT,
          uploadedAt: { not: null },
          deletedAt: null,
        },
      },
    },
  },
} satisfies Prisma.PostSelect;

const boardPostOrderBy = [
  { isPinned: "desc" },
  { publishedAt: "desc" },
  { createdAt: "desc" },
  { id: "desc" },
] satisfies Prisma.PostOrderByWithRelationInput[];

type BoardPostRow = Prisma.PostGetPayload<{ select: typeof boardPostSelect }>;

export async function getPublishedPostPage(
  type: PostType,
  requestedPage: number,
  filters: PublishedPostFilters = {},
) {
  "use cache";
  cacheLife("hours");
  cacheTag(getPublishedPostsCacheTag(type));

  try {
    const where = getPublishedPostWhere(type, filters);
    const totalItems = await prisma.post.count({ where });
    const pagination = getPostPageWindow(requestedPage, totalItems);
    const posts = await prisma.post.findMany({
      where,
      select: boardPostSelect,
      orderBy: boardPostOrderBy,
      skip: pagination.offset,
      take: POSTS_PER_PAGE,
    });

    return { ...pagination, posts: posts.map(mapBoardPost) };
  } catch (error) {
    logServerError("posts.getPublishedPostPage", error, { type });

    if (isPrismaMissingTableError(error)) {
      console.error(
        "[server-error] posts table is missing. Run `npm run db:deploy` against the production database.",
      );
      return { ...getPostPageWindow(1, 0), posts: [] as BoardPost[] };
    }

    throw error;
  }
}

export async function getPublishedPostPreview(
  type: PostType,
  options: PublishedPostFilters & { take: number },
): Promise<BoardPost[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(getPublishedPostsCacheTag(type));

  try {
    const posts = await prisma.post.findMany({
      where: getPublishedPostWhere(type, options),
      select: boardPostSelect,
      orderBy: boardPostOrderBy,
      take: Math.min(Math.max(1, options.take), POSTS_PER_PAGE),
    });

    return posts.map(mapBoardPost);
  } catch (error) {
    logServerError("posts.getPublishedPostPreview", error, { type });

    if (isPrismaMissingTableError(error)) return [];
    throw error;
  }
}

export async function getPublishedPostBySlug(
  type: PostType,
  slug: string,
  includeFileUrls = true,
): Promise<BoardPostDetail | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 3300 });
  cacheTag(getPublishedPostsCacheTag(type));

  const decodedSlug = decodePostSlug(slug);

  if (!decodedSlug || hiddenPublicPostSlugs.includes(decodedSlug)) {
    return null;
  }

  const post = await findPublishedPostBySlug(type, decodedSlug);

  if (!post) {
    return null;
  }

  const urls = includeFileUrls
    ? await createResearchFileUrls(
        post.attachments.map((file) => ({
          objectPath: file.objectPath,
          originalName: file.originalName,
          download: file.kind === AttachmentKind.ATTACHMENT,
        })),
      )
    : post.attachments.map(() => null);

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category?.name ?? getDefaultCategoryName(post.type),
    categorySlug: post.category?.slug ?? getDefaultCategorySlug(post.type),
    summary: post.summary ?? post.content.slice(0, 120),
    content: post.content,
    authorId: post.authorId,
    publishedAt: formatDate(post.publishedAt ?? post.createdAt),
    isPinned: post.isPinned,
    authorName: post.author?.name ?? null,
    attachmentCount: post.attachments.filter(
      (file) => file.kind === AttachmentKind.ATTACHMENT,
    ).length,
    attachments: post.attachments.map((file, index) => ({
      id: file.id,
      kind: file.kind,
      originalName: file.originalName,
      contentType: file.contentType,
      size: file.size,
      altText: file.altText,
      imageWidth: file.imageWidth,
      imageHeight: file.imageHeight,
      url: urls[index],
    })),
  };
}

export async function getPublishedPostMetadataBySlug(type: PostType, slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(getPublishedPostsCacheTag(type));

  const decodedSlug = decodePostSlug(slug);

  if (!decodedSlug || hiddenPublicPostSlugs.includes(decodedSlug)) {
    return null;
  }

  const post = await findPublishedPostBySlug(type, decodedSlug);

  return post
    ? {
        title: post.title,
        summary: post.summary ?? post.content.slice(0, 120),
      }
    : null;
}

async function findPublishedPostBySlug(type: PostType, decodedSlug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(getPublishedPostsCacheTag(type));

  try {
    return await prisma.post.findFirst({
      where: {
        slug: decodedSlug,
        type,
        status: PostStatus.PUBLISHED,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        type: true,
        isPinned: true,
        publishedAt: true,
        createdAt: true,
        authorId: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        author: {
          select: {
            name: true,
          },
        },
        attachments: {
          where: { uploadedAt: { not: null }, deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            kind: true,
            originalName: true,
            objectPath: true,
            contentType: true,
            size: true,
            altText: true,
            imageWidth: true,
            imageHeight: true,
          },
        },
      },
    });
  } catch (error) {
    logServerError("posts.findPublishedPostBySlug", error, {
      type,
      slug: decodedSlug,
    });

    if (isPrismaMissingTableError(error)) {
      console.error(
        "[server-error] posts table is missing. Run `npm run db:deploy` against the production database.",
      );
      return null;
    }

    throw error;
  }
}

function getPublishedPostWhere(
  type: PostType,
  filters: PublishedPostFilters,
): Prisma.PostWhereInput {
  return {
    type,
    status: PostStatus.PUBLISHED,
    deletedAt: null,
    slug: {
      notIn: hiddenPublicPostSlugs,
      ...(filters.slugs ? { in: filters.slugs } : {}),
    },
    ...(filters.categorySlugs
      ? { category: { slug: { in: filters.categorySlugs } } }
      : {}),
  };
}

function mapBoardPost(post: BoardPostRow): BoardPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category?.name ?? getDefaultCategoryName(post.type),
    categorySlug: post.category?.slug ?? getDefaultCategorySlug(post.type),
    summary: post.summary ?? "",
    publishedAt: formatDate(post.publishedAt ?? post.createdAt),
    isPinned: post.isPinned,
    authorName: post.author?.name ?? null,
    attachmentCount: post._count.attachments,
  };
}

function getDefaultCategoryName(type: PostType) {
  if (type === PostType.NOTICE) {
    return "공지";
  }

  if (type === PostType.RESEARCH) {
    return "연구 글";
  }

  return "홍보자료";
}

function getDefaultCategorySlug(type: PostType) {
  if (type === PostType.NOTICE) {
    return "notice";
  }

  if (type === PostType.RESEARCH) {
    return "research";
  }

  return "promotion";
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
