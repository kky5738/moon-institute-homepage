import { cache } from "react";
import { AttachmentKind, PostStatus, PostType } from "@/generated/prisma/enums";
import { decodePostSlug } from "@/lib/post-slug";
import { prisma } from "@/lib/prisma";
import { isPrismaMissingTableError, logServerError } from "@/lib/server-log";
import { createResearchFileUrls } from "@/lib/supabase-storage";

const hiddenPublicPostSlugs = ["institute-introduction-material"];

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

export async function getPublishedPosts(type: PostType): Promise<BoardPost[]> {
  try {
    const posts = await prisma.post.findMany({
      where: {
        type,
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        slug: {
          notIn: hiddenPublicPostSlugs,
        },
      },
      select: {
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
      summary: post.summary ?? "",
      publishedAt: formatDate(post.publishedAt ?? post.createdAt),
      isPinned: post.isPinned,
      authorName: post.author?.name ?? null,
      attachmentCount: post._count.attachments,
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
  includeFileUrls = true,
): Promise<BoardPostDetail | null> {
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

const findPublishedPostBySlug = cache(
  async (type: PostType, decodedSlug: string) => {
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
  },
);

export async function getPinnedNotice(): Promise<BoardPost | null> {
  const posts = await getPublishedPosts(PostType.NOTICE);
  return posts.find((post) => post.isPinned) ?? posts[0] ?? null;
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
