"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { AttachmentKind, PostStatus, PostType } from "@/generated/prisma/enums";
import { createPostSlug } from "@/lib/post-slug";
import { prisma } from "@/lib/prisma";
import {
  createResearchObjectPath,
  getResearchImageIds,
  type ResearchUploadMetadata,
  validateResearchUpload,
} from "@/lib/research-files";
import { assertResearcher } from "@/lib/researcher-auth";
import { logServerError } from "@/lib/server-log";
import {
  createResearchUploadTicket,
  removeResearchObjects,
  verifyResearchUpload,
} from "@/lib/supabase-storage";

export type ResearchActionResult<T extends object = { __empty?: never }> =
  | ({ ok: true } & T)
  | { ok: false; message: string };

export async function prepareResearchPost(
  formData: FormData,
): Promise<ResearchActionResult<{ postId: number }>> {
  const user = await assertResearcher();

  try {
    const status = parsePostIntent(formData);
    const title = getPostTitle(formData, status);
    const content = getPostContent(formData, status);
    const rawId = getOptionalString(formData, "id");

    if (rawId) {
      const postId = parsePostId(rawId);
      await requireOwnedResearchPost(postId, user.id);
      return { ok: true, postId };
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug: createPostSlug(title, randomUUID().slice(0, 8)),
        summary: getSummary(formData),
        content,
        type: PostType.RESEARCH,
        status: PostStatus.DRAFT,
        authorId: user.id,
      },
      select: { id: true },
    });

    revalidateResearchPaths();
    return { ok: true, postId: post.id };
  } catch (error) {
    logServerError("researcher.posts.prepare", error, { userId: user.id });
    return actionError(error);
  }
}

export async function requestResearchUpload(
  postId: number,
  metadata: ResearchUploadMetadata,
): Promise<
  ResearchActionResult<{
    bucket: string;
    path: string;
    token: string;
    supabaseUrl: string;
    publishableKey: string;
  }>
> {
  const user = await assertResearcher();

  try {
    await requireOwnedResearchPost(postId, user.id);
    const file = validateResearchUpload(metadata);
    const objectPath = createResearchObjectPath(
      user.id,
      postId,
      file.id,
      file.extension,
    );
    const ticket = await createResearchUploadTicket(objectPath);

    await prisma.postAttachment.create({
      data: {
        id: file.id,
        postId,
        kind: file.kind as AttachmentKind,
        originalName: file.originalName,
        objectPath,
        contentType: file.contentType,
        size: file.size,
        altText: file.altText,
        imageWidth: file.imageWidth,
        imageHeight: file.imageHeight,
      },
    });

    return { ok: true, ...ticket };
  } catch (error) {
    logServerError("researcher.posts.upload.request", error, {
      postId,
      userId: user.id,
    });
    return actionError(error);
  }
}

export async function confirmResearchUpload(
  attachmentId: string,
): Promise<ResearchActionResult> {
  const user = await assertResearcher();

  try {
    const attachment = await prisma.postAttachment.findFirst({
      where: {
        id: attachmentId,
        deletedAt: null,
        post: {
          authorId: user.id,
          type: PostType.RESEARCH,
          status: { not: PostStatus.ARCHIVED },
          deletedAt: null,
        },
      },
    });

    if (!attachment) throw new Error("확인할 업로드를 찾을 수 없습니다.");
    if (attachment.uploadedAt) return { ok: true };

    await verifyResearchUpload(attachment.objectPath, {
      size: attachment.size,
      contentType: attachment.contentType,
      inlineImage: attachment.kind === AttachmentKind.INLINE_IMAGE,
    });
    await prisma.postAttachment.update({
      where: { id: attachment.id },
      data: { uploadedAt: new Date() },
    });

    return { ok: true };
  } catch (error) {
    logServerError("researcher.posts.upload.confirm", error, {
      attachmentId,
      userId: user.id,
    });
    return actionError(error);
  }
}

export async function discardResearchUpload(attachmentId: string) {
  const user = await assertResearcher();
  const attachment = await prisma.postAttachment.findFirst({
    where: {
      id: attachmentId,
      post: { authorId: user.id, type: PostType.RESEARCH },
    },
    select: { id: true, objectPath: true },
  });

  if (!attachment) return;
  await prisma.postAttachment.update({
    where: { id: attachment.id },
    data: { deletedAt: new Date() },
  });

  try {
    await removeResearchObjects([attachment.objectPath]);
  } catch (error) {
    // ponytail: keep the soft-deleted row for manual cleanup; add a retry job if orphan volume grows.
    logServerError("researcher.posts.upload.discard", error, {
      attachmentId,
      userId: user.id,
    });
  }
}

export async function saveResearchPost(
  formData: FormData,
): Promise<ResearchActionResult<{ redirectTo: string }>> {
  const user = await assertResearcher();

  try {
    const postId = parsePostId(getRequiredString(formData, "id"));
    const status = parsePostIntent(formData);
    const title = getPostTitle(formData, status);
    const content = getPostContent(formData, status);
    const post = await requireOwnedResearchPost(postId, user.id);
    const imageIds = [...new Set(getResearchImageIds(content))];
    const removedIds = formData
      .getAll("removedAttachmentId")
      .filter((value): value is string => typeof value === "string");

    const uploadedImages = await prisma.postAttachment.findMany({
      where: {
        id: { in: imageIds },
        postId,
        kind: AttachmentKind.INLINE_IMAGE,
        uploadedAt: { not: null },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (uploadedImages.length !== imageIds.length) {
      throw new Error("본문에 아직 업로드되지 않은 이미지가 있습니다.");
    }

    await prisma.$transaction([
      prisma.postAttachment.updateMany({
        where: {
          postId,
          deletedAt: null,
          OR: [
            { id: { in: removedIds } },
            { kind: AttachmentKind.INLINE_IMAGE, id: { notIn: imageIds } },
          ],
        },
        data: { deletedAt: new Date() },
      }),
      prisma.post.update({
        where: { id: post.id },
        data: {
          title,
          summary: getSummary(formData),
          content,
          status,
          publishedAt:
            status === PostStatus.PUBLISHED
              ? (post.publishedAt ?? new Date())
              : post.publishedAt,
        },
      }),
    ]);

    revalidateResearchPaths();
    revalidatePath(`/research/${post.slug}`);
    return { ok: true, redirectTo: "/account/posts" };
  } catch (error) {
    logServerError("researcher.posts.save", error, { userId: user.id });
    return actionError(error);
  }
}

function revalidateResearchPaths() {
  revalidatePath("/research");
  revalidatePath("/account");
  revalidatePath("/account/posts");
  revalidatePath("/admin/posts");
}

async function requireOwnedResearchPost(postId: number, userId: number) {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      authorId: userId,
      type: PostType.RESEARCH,
      status: { not: PostStatus.ARCHIVED },
      deletedAt: null,
    },
    select: { id: true, slug: true, publishedAt: true },
  });

  if (!post) throw new Error("수정할 수 있는 게시글을 찾을 수 없습니다.");
  return post;
}

function parsePostIntent(formData: FormData) {
  const intent = formData.get("intent");
  if (intent === "draft") return PostStatus.DRAFT;
  if (intent === "publish") return PostStatus.PUBLISHED;
  throw new Error("저장 방식을 선택해주세요.");
}

function getPostTitle(formData: FormData, status: PostStatus) {
  const title = getOptionalString(formData, "title");
  if (title) {
    if (title.length > 200) throw new Error("제목은 200자 이하로 입력해주세요.");
    return title;
  }
  if (status === PostStatus.DRAFT) return "제목 없는 글";
  throw new Error("제목을 입력해주세요.");
}

function getPostContent(formData: FormData, status: PostStatus) {
  const content = getOptionalString(formData, "content");
  if (content) {
    if (content.length > 100_000) {
      throw new Error("본문은 100,000자 이하로 입력해주세요.");
    }
    return content;
  }
  if (status === PostStatus.DRAFT) return "";
  throw new Error("본문을 입력해주세요.");
}

function getSummary(formData: FormData) {
  const summary = getOptionalString(formData, "summary");
  if (summary && summary.length > 500) {
    throw new Error("요약은 500자 이하로 입력해주세요.");
  }
  return summary;
}

function parsePostId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error("유효한 게시글 ID가 필요합니다.");
  }
  return id;
}

function getRequiredString(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);
  if (!value) throw new Error(`${key} 값이 필요합니다.`);
  return value;
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function actionError(error: unknown): ResearchActionResult<never> {
  const message =
    error instanceof Error &&
    /[가-힣]/.test(error.message) &&
    !("code" in error) &&
    !error.cause
      ? error.message
      : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
  return {
    ok: false,
    message,
  };
}
