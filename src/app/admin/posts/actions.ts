"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  PostPhase,
  PostStatus,
} from "@/generated/prisma/enums";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";

export async function createPost(formData: FormData) {
  await assertAdmin();

  try {
    const title = getRequiredString(formData, "title");
    const slug = normalizeSlug(getRequiredString(formData, "slug"));
    const content = getRequiredString(formData, "content");
    const summary = getOptionalString(formData, "summary");
    const categoryId = Number(getRequiredString(formData, "categoryId"));
    const status = parsePostStatus(getRequiredString(formData, "status"));
    const phase = parsePostPhase(getRequiredString(formData, "phase"));

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

    await prisma.post.create({
      data: {
        title,
        slug,
        summary,
        content,
        categoryId: category.id,
        type: category.postType,
        status,
        phase,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      },
    });
  } catch (error) {
    logServerError("admin.posts.create", error);
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/materials");
  revalidatePath("/admin/posts");

  redirect("/admin/posts");
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
  return value.trim().toLowerCase();
}

function parsePostStatus(value: string) {
  if (value === PostStatus.DRAFT) {
    return PostStatus.DRAFT;
  }

  if (value === PostStatus.PUBLISHED) {
    return PostStatus.PUBLISHED;
  }

  if (value === PostStatus.ARCHIVED) {
    return PostStatus.ARCHIVED;
  }

  throw new Error("유효하지 않은 게시글 상태입니다.");
}

function parsePostPhase(value: string) {
  if (value === PostPhase.PRE_LAUNCH) {
    return PostPhase.PRE_LAUNCH;
  }

  if (value === PostPhase.OFFICIAL) {
    return PostPhase.OFFICIAL;
  }

  throw new Error("유효하지 않은 운영 단계입니다.");
}
