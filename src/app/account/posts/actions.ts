"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PostStatus, PostType } from "@/generated/prisma/enums";
import { createPostSlug } from "@/lib/post-slug";
import { prisma } from "@/lib/prisma";
import { assertResearcher } from "@/lib/researcher-auth";
import { logServerError } from "@/lib/server-log";

export async function createResearchPost(formData: FormData) {
  const user = await assertResearcher();

  try {
    const status = parsePostIntent(formData);
    const title = getPostTitle(formData, status);
    const content = getPostContent(formData, status);

    await prisma.post.create({
      data: {
        title,
        slug: createPostSlug(title, randomUUID().slice(0, 8)),
        summary: getSummary(formData),
        content,
        type: PostType.RESEARCH,
        status,
        authorId: user.id,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      },
    });
  } catch (error) {
    logServerError("researcher.posts.create", error, { userId: user.id });
    throw error;
  }

  revalidateResearchPaths();
  redirect("/account/posts");
}

export async function updateResearchPost(formData: FormData) {
  const user = await assertResearcher();

  try {
    const id = Number(getRequiredString(formData, "id"));
    const status = parsePostIntent(formData);

    if (!Number.isInteger(id) || id < 1) {
      throw new Error("유효한 게시글 ID가 필요합니다.");
    }

    const post = await prisma.post.findFirst({
      where: {
        id,
        authorId: user.id,
        type: PostType.RESEARCH,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        publishedAt: true,
      },
    });

    if (!post || post.status === PostStatus.ARCHIVED) {
      throw new Error("수정할 수 있는 게시글을 찾을 수 없습니다.");
    }

    await prisma.post.update({
      where: { id: post.id },
      data: {
        title: getPostTitle(formData, status),
        summary: getSummary(formData),
        content: getPostContent(formData, status),
        status,
        publishedAt:
          status === PostStatus.PUBLISHED
            ? (post.publishedAt ?? new Date())
            : post.publishedAt,
      },
    });
  } catch (error) {
    logServerError("researcher.posts.update", error, { userId: user.id });
    throw error;
  }

  revalidateResearchPaths();
  redirect("/account/posts");
}

function revalidateResearchPaths() {
  revalidatePath("/research");
  revalidatePath("/account");
  revalidatePath("/account/posts");
  revalidatePath("/admin/posts");
}

function parsePostIntent(formData: FormData) {
  const intent = formData.get("intent");

  if (intent === "draft") {
    return PostStatus.DRAFT;
  }

  if (intent === "publish") {
    return PostStatus.PUBLISHED;
  }

  throw new Error("저장 방식을 선택해주세요.");
}

function getPostTitle(formData: FormData, status: PostStatus) {
  const title = getOptionalString(formData, "title");

  if (title) {
    if (title.length > 200) {
      throw new Error("제목은 200자 이하로 입력해주세요.");
    }

    return title;
  }

  if (status === PostStatus.DRAFT) {
    return "제목 없는 글";
  }

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

  if (status === PostStatus.DRAFT) {
    return "";
  }

  throw new Error("본문을 입력해주세요.");
}

function getSummary(formData: FormData) {
  const summary = getOptionalString(formData, "summary");

  if (summary && summary.length > 500) {
    throw new Error("요약은 500자 이하로 입력해주세요.");
  }

  return summary;
}

function getRequiredString(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return value;
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
