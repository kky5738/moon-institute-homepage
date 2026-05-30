import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  PostPhase,
  PostStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { createPost } from "../actions";

export const metadata: Metadata = {
  title: "새 게시글",
  description: "공지사항 또는 홍보자료 게시글을 작성합니다.",
};

export default async function NewPostPage() {
  await connection();

  let categories;

  try {
    categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { postType: "asc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });
  } catch (error) {
    logServerError("admin.posts.new.categories", error);
    throw error;
  }

  const hasCategories = categories.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14 lg:px-8">
      <Link href="/admin/posts" className="text-sm font-semibold text-primary hover:underline">
        게시글 목록
      </Link>
      <div className="mt-6 border-b border-border pb-8">
        <p className="text-sm font-semibold text-primary">관리자</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          새 게시글 작성
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          카테고리를 선택하면 공지사항 또는 홍보자료 게시판에 연결됩니다.
        </p>
      </div>

      <form action={createPost} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-foreground" htmlFor="title">
            제목
          </label>
          <input
            id="title"
            name="title"
            required
            className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground" htmlFor="slug">
            슬러그
          </label>
          <input
            id="slug"
            name="slug"
            required
            pattern="[a-zA-Z0-9-]+"
            placeholder="example-post-title"
            className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground" htmlFor="summary">
            요약
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={3}
            className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground" htmlFor="content">
            본문
          </label>
          <textarea
            id="content"
            name="content"
            rows={12}
            required
            className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm leading-6 outline-none focus:border-primary"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-foreground" htmlFor="categoryId">
              카테고리
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              disabled={!hasCategories}
              className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">선택</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.postType === "NOTICE" ? "공지사항" : "홍보자료"} / {category.name}
                </option>
              ))}
            </select>
            {!hasCategories ? (
              <p className="mt-2 text-sm text-red-700">
                활성 카테고리가 없습니다. 먼저 seed 또는 관리자 카테고리 데이터를 확인해주세요.
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground" htmlFor="status">
              상태
            </label>
            <select
              id="status"
              name="status"
              defaultValue={PostStatus.DRAFT}
              className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value={PostStatus.DRAFT}>초안</option>
              <option value={PostStatus.PUBLISHED}>공개</option>
              <option value={PostStatus.ARCHIVED}>보관</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground" htmlFor="phase">
              운영 단계
            </label>
            <select
              id="phase"
              name="phase"
              defaultValue={PostPhase.PRE_LAUNCH}
              className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value={PostPhase.PRE_LAUNCH}>출범 전</option>
              <option value={PostPhase.OFFICIAL}>출범 후</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Link
            href="/admin/posts"
            className="inline-flex h-11 items-center border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:border-accent"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={!hasCategories}
            className="inline-flex h-11 items-center border border-primary bg-primary-dark px-5 text-sm font-semibold text-white hover:bg-primary"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
