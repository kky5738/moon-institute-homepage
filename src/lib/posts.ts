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
      include: {
        category: true,
        author: {
          select: {
            name: true,
          },
        },
        attachments: {
          where: {
            kind: AttachmentKind.ATTACHMENT,
            uploadedAt: { not: null },
            deletedAt: null,
          },
          select: { id: true },
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
      summary: post.summary ?? post.content.slice(0, 120),
      publishedAt: formatDate(post.publishedAt ?? post.createdAt),
      isPinned: post.isPinned,
      authorName: post.author?.name ?? null,
      attachmentCount: post.attachments.length,
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

  try {
    const post = await prisma.post.findFirst({
      where: {
        slug: decodedSlug,
        type,
        status: PostStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        category: true,
        author: {
          select: {
            name: true,
          },
        },
        attachments: {
          where: { uploadedAt: { not: null }, deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

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
