"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { PostStatus, PostType } from "@/generated/prisma/enums";
import { AdminUnauthorizedError, assertAdmin } from "@/lib/admin-auth";
import {
  getAdminEditableCategoryWhere,
  getAdminEditablePostWhere,
} from "@/lib/admin-posts";
import { prisma } from "@/lib/prisma";
import { getPublishedPostsCacheTag } from "@/lib/posts";
import { logServerError } from "@/lib/server-log";
import { removeResearchObjects } from "@/lib/supabase-storage";

export type PostFormState = {
  status: "idle" | "validation" | "auth" | "error";
  message: string;
};

class PostValidationError extends Error {}

export async function createPost(_previous: PostFormState, formData: FormData): Promise<PostFormState> {
  let affectedType: PostType;

  try {
    await assertAdmin();
    const title = getRequiredString(formData, "title");
    const slug = normalizeSlug(getRequiredString(formData, "slug"));
    const content = getRequiredString(formData, "content");
    const summary = getOptionalString(formData, "summary");
    const categoryId = Number(getRequiredString(formData, "categoryId"));
    const status = parsePostIntent(formData);

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      throw new PostValidationError("유효한 카테고리를 선택해주세요.");
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new PostValidationError("사용 가능한 카테고리를 선택해주세요.");
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
      throw new PostValidationError("이미 사용 중인 슬러그입니다.");
    }

    affectedType = category.postType;
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
    return postSaveError("admin.posts.create", error);
  }

  revalidatePostPaths(affectedType);

  redirect("/admin/posts");
}

export async function updatePost(_previous: PostFormState, formData: FormData): Promise<PostFormState> {
  let affectedTypes: PostType[];

  try {
    await assertAdmin();
    const id = Number(getRequiredString(formData, "id"));
    const title = getRequiredString(formData, "title");
    const slug = normalizeSlug(getRequiredString(formData, "slug"));
    const content = getRequiredString(formData, "content");
    const summary = getOptionalString(formData, "summary");
    const categoryId = Number(getRequiredString(formData, "categoryId"));
    const status = parsePostIntent(formData);

    if (!Number.isInteger(id) || id < 1) {
      throw new PostValidationError("유효한 게시글 ID가 필요합니다.");
    }

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      throw new PostValidationError("유효한 카테고리를 선택해주세요.");
    }

    const [post, category, duplicatePost] = await Promise.all([
      prisma.post.findFirst({
        where: getAdminEditablePostWhere(id),
        select: {
          id: true,
          type: true,
          publishedAt: true,
        },
      }),
      prisma.category.findFirst({
        where: getAdminEditableCategoryWhere(categoryId),
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
      throw new PostValidationError("수정할 수 있는 게시글을 찾을 수 없습니다.");
    }

    if (!category) {
      throw new PostValidationError("사용 가능한 카테고리를 선택해주세요.");
    }

    if (duplicatePost) {
      throw new PostValidationError("이미 사용 중인 슬러그입니다.");
    }

    affectedTypes = [post.type, category.postType];
    const { count } = await prisma.post.updateMany({
      where: getAdminEditablePostWhere(id),
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
    if (count !== 1) {
      throw new PostValidationError("수정할 수 있는 게시글을 찾을 수 없습니다.");
    }
  } catch (error) {
    return postSaveError("admin.posts.update", error);
  }

  revalidatePostPaths(...affectedTypes);

  redirect("/admin/posts");
}

export async function archivePost(formData: FormData) {
  await assertAdmin();
  let affectedType: PostType;

  try {
    const id = Number(getRequiredString(formData, "id"));

    if (!Number.isInteger(id) || id < 1) {
      throw new Error("유효한 게시글 ID가 필요합니다.");
    }

    const [post] = await prisma.post.updateManyAndReturn({
      where: { id, deletedAt: null },
      data: { status: PostStatus.ARCHIVED },
      select: { type: true },
    });
    if (!post) throw new Error("게시글을 찾을 수 없습니다.");
    affectedType = post.type;
  } catch (error) {
    logServerError("admin.posts.archive", error);
    throw error;
  }

  revalidatePostPaths(affectedType);

  redirect("/admin/posts");
}

export async function deletePost(_previous: PostFormState, formData: FormData): Promise<PostFormState> {
  let files: Array<{ id: string; objectPath: string }> = [];
  let affectedType: PostType;
  try {
    await assertAdmin();
    const id = Number(getRequiredString(formData, "id"));
    if (!Number.isInteger(id) || id < 1) throw new PostValidationError("유효한 게시글 ID가 필요합니다.");

    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.post.findFirst({
        where: { id, type: { in: [PostType.NOTICE, PostType.PROMOTION] }, status: PostStatus.ARCHIVED },
        select: { type: true, deletedAt: true },
      });
      if (!post) throw new PostValidationError("보관된 공지사항 또는 홍보자료만 삭제할 수 있습니다.");
      if (!post.deletedAt) {
        const deletedAt = new Date();
        const { count } = await tx.post.updateMany({
          where: { ...getAdminEditablePostWhere(id), status: PostStatus.ARCHIVED },
          data: { deletedAt },
        });
        if (count !== 1) throw new PostValidationError("게시글 상태가 변경되었습니다. 목록을 새로고침해주세요.");
        await tx.postAttachment.updateMany({ where: { postId: id, deletedAt: null }, data: { deletedAt } });
      }
      const attachments = await tx.postAttachment.findMany({ where: { postId: id }, select: { id: true, objectPath: true } });
      return { type: post.type, attachments };
    });
    files = result.attachments;
    affectedType = result.type;
    await removeResearchObjects(files.map((file) => file.objectPath));
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AdminUnauthorizedError || error instanceof PostValidationError) return postSaveError("admin.posts.delete", error);
    logServerError("admin.posts.delete", error, { files });
    // shortcut: 화면 이동 후 재시도 불가, 정리 상태 추적을 도입할 때 개선한다.
    return { status: "error", message: "삭제 처리를 완료하지 못했습니다. 이 화면에서 다시 시도해주세요." };
  }
  revalidatePostPaths(affectedType);
  redirect("/admin/posts");
}

function revalidatePostPaths(...types: PostType[]) {
  for (const type of new Set(types)) {
    updateTag(getPublishedPostsCacheTag(type));
    revalidatePath(getPublicPostPath(type));

    if (type === PostType.PROMOTION) revalidatePath("/");
    if (type !== PostType.RESEARCH) {
      revalidatePath("/topics/[slug]", "page");
    }
  }

  revalidatePath("/admin/posts");
}

function getPublicPostPath(type: PostType) {
  if (type === PostType.NOTICE) return "/notices";
  if (type === PostType.PROMOTION) return "/materials";
  return "/research";
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    const labels: Record<string, string> = { title: "제목", slug: "슬러그", content: "본문", categoryId: "카테고리", id: "게시글 ID" };
    throw new PostValidationError(`${labels[key] ?? key}을(를) 입력해주세요.`);
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
    throw new PostValidationError("슬러그는 영문자, 숫자, 하이픈만 사용할 수 있습니다.");
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

  throw new PostValidationError("저장 방식을 선택해주세요.");
}

function postSaveError(context: string, error: unknown): PostFormState {
  unstable_rethrow(error);
  if (error instanceof AdminUnauthorizedError) {
    return { status: "auth", message: "관리자 세션이 만료되었거나 권한이 없습니다. 새 창에서 로그인한 후 다시 저장해주세요." };
  }
  if (error instanceof PostValidationError) {
    return { status: "validation", message: error.message };
  }
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    return { status: "validation", message: "이미 사용 중인 슬러그입니다." };
  }
  logServerError(context, error);
  return { status: "error", message: "저장하지 못했습니다. 잠시 후 다시 시도해주세요." };
}
