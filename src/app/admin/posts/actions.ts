"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { PostStatus } from "@/generated/prisma/enums";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { publishedPostsCacheTag } from "@/lib/posts";
import { logServerError } from "@/lib/server-log";

export async function createPost(formData: FormData) {
  await assertAdmin();

  try {
    const title = getRequiredString(formData, "title");
    const slug = normalizeSlug(getRequiredString(formData, "slug"));
    const content = getRequiredString(formData, "content");
    const summary = getOptionalString(formData, "summary");
    const categoryId = Number(getRequiredString(formData, "categoryId"));
    const status = parsePostIntent(formData);

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      throw new Error("유효한 카테고리를 선택해주세요.");
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new Error("카테고리를 찾을 수 없습니다.");
    }

    const duplicatePost = await prisma.post.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (duplicatePost) {
      throw new Error("이미 사용 중인 슬러그입니다.");
    }

    await prisma.post.create({
      data: {
        title,
        slug,
        summary,
        content,
        categoryId: category.id,
        type: category.postType,
        status,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      },
    });
  } catch (error) {
    logServerError("admin.posts.create", error);
    throw error;
  }

  revalidatePostPaths();

  redirect("/admin/posts");
}

export async function updatePost(formData: FormData) {
  await assertAdmin();

  try {
    const id = Number(getRequiredString(formData, "id"));
    const title = getRequiredString(formData, "title");
    const slug = normalizeSlug(getRequiredString(formData, "slug"));
    const content = getRequiredString(formData, "content");
    const summary = getOptionalString(formData, "summary");
    const categoryId = Number(getRequiredString(formData, "categoryId"));
    const status = parsePostIntent(formData);

    if (!Number.isInteger(id) || id < 1) {
      throw new Error("유효한 게시글 ID가 필요합니다.");
    }

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      throw new Error("유효한 카테고리를 선택해주세요.");
    }

    const [post, category, duplicatePost] = await Promise.all([
      prisma.post.findUnique({
        where: { id },
        select: {
          id: true,
          publishedAt: true,
        },
      }),
      prisma.category.findFirst({
        where: {
          id: categoryId,
          isActive: true,
        },
      }),
      prisma.post.findFirst({
        where: {
          slug,
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!post) {
      throw new Error("게시글을 찾을 수 없습니다.");
    }

    if (!category) {
      throw new Error("카테고리를 찾을 수 없습니다.");
    }

    if (duplicatePost) {
      throw new Error("이미 사용 중인 슬러그입니다.");
    }

    await prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        summary,
        content,
        categoryId: category.id,
        type: category.postType,
        status,
        publishedAt:
          status === PostStatus.PUBLISHED
            ? (post.publishedAt ?? new Date())
            : post.publishedAt,
      },
    });
  } catch (error) {
    logServerError("admin.posts.update", error);
    throw error;
  }

  revalidatePostPaths();

  redirect("/admin/posts");
}

export async function archivePost(formData: FormData) {
  await assertAdmin();

  try {
    const id = Number(getRequiredString(formData, "id"));

    if (!Number.isInteger(id) || id < 1) {
      throw new Error("유효한 게시글 ID가 필요합니다.");
    }

    await prisma.post.update({
      where: { id },
      data: {
        status: PostStatus.ARCHIVED,
      },
    });
  } catch (error) {
    logServerError("admin.posts.archive", error);
    throw error;
  }

  revalidatePostPaths();

  redirect("/admin/posts");
}

function revalidatePostPaths() {
  updateTag(publishedPostsCacheTag);
  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/materials");
  revalidatePath("/research");
  revalidatePath("/admin/posts");
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSlug(value: string) {
  const slug = value.trim().toLowerCase();

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.");
  }

  return slug;
}

function parsePostIntent(formData: FormData) {
  const value = formData.get("intent");

  if (value === "draft") {
    return PostStatus.DRAFT;
  }

  if (value === "publish") {
    return PostStatus.PUBLISHED;
  }

  throw new Error("저장 방식을 선택해주세요.");
}
