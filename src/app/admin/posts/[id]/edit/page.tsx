import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  PostPhase,
  PostStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { archivePost, updatePost } from "../../actions";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "게시글 수정",
  description: "공지사항 또는 홍보자료 게시글을 수정합니다.",
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  await connection();

  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  let post;
  let categories;

  try {
    [post, categories] = await Promise.all([
      prisma.post.findUnique({
        where: { id },
        include: {
          category: true,
        },
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
        },
        orderBy: [
          { postType: "asc" },
          { sortOrder: "asc" },
          { name: "asc" },
        ],
      }),
    ]);
  } catch (error) {
    logServerError("admin.posts.edit.load", error, { id });
    throw error;
  }

  if (!post) {
    notFound();
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
          게시글 수정
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          게시글 내용을 수정하거나 공개 상태를 보관으로 변경합니다.
        </p>
      </div>

      <form action={updatePost} className="mt-8 space-y-6">
        <input type="hidden" name="id" value={post.id} />

        <div>
          <label className="block text-sm font-semibold text-foreground" htmlFor="title">
            제목
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={post.title}
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
            defaultValue={post.slug}
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
            defaultValue={post.summary ?? ""}
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
            defaultValue={post.content}
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
              defaultValue={post.categoryId ?? ""}
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
              defaultValue={post.status}
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
              defaultValue={post.phase}
              className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value={PostPhase.PRE_LAUNCH}>출범 전</option>
              <option value={PostPhase.OFFICIAL}>출범 후</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
          <Link
            href="/admin/posts"
            className="inline-flex h-11 items-center border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:border-accent"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={!hasCategories}
            className="inline-flex h-11 cursor-pointer items-center border border-primary bg-primary-dark px-5 text-sm font-semibold text-white hover:bg-primary disabled:cursor-not-allowed"
          >
            수정 저장
          </button>
        </div>
      </form>

      {post.status !== PostStatus.ARCHIVED ? (
        <form action={archivePost} className="mt-4 flex justify-end">
          <input type="hidden" name="id" value={post.id} />
          <button
            type="submit"
            className="inline-flex h-10 cursor-pointer items-center border border-border bg-surface px-4 text-sm font-semibold text-primary-dark hover:border-primary hover:text-foreground"
          >
            게시글 보관
          </button>
        </form>
      ) : null}
    </div>
  );
}
