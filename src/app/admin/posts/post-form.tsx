"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { PendingButton } from "@/components/ui/pending-button";
import { createPost, updatePost, type PostFormState } from "./actions";

type Category = { id: number; name: string; postType: string };
type Post = { id: number; title: string; slug: string; summary: string | null; content: string; categoryId: number | null };

const initialState: PostFormState = { status: "idle", message: "" };

export function PostForm({ categories, post }: { categories: Category[]; post?: Post }) {
  const [state, formAction] = useActionState(post ? updatePost : createPost, initialState);
  const [values, setValues] = useState({
    title: post?.title ?? "", slug: post?.slug ?? "", summary: post?.summary ?? "",
    content: post?.content ?? "", categoryId: post?.categoryId?.toString() ?? "",
  });
  const categoryRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (categoryRef.current) categoryRef.current.value = values.categoryId;
  }, [state, values.categoryId]);
  const hasCategories = categories.length > 0;

  return (
      <form action={formAction} className="mt-8 space-y-6">
        {post && <input type="hidden" name="id" value={post.id} />}
        <div>
          <label className="block text-sm font-semibold text-foreground" htmlFor="title">
            제목
          </label>
          <input
            id="title"
            name="title"
            required
            value={values.title}
            onChange={(event) => setValues({ ...values, title: event.target.value })}
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
            value={values.slug}
            onChange={(event) => setValues({ ...values, slug: event.target.value })}
            pattern={"[a-zA-Z0-9\\-]+"}
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
            value={values.summary}
            onChange={(event) => setValues({ ...values, summary: event.target.value })}
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
            value={values.content}
            onChange={(event) => setValues({ ...values, content: event.target.value })}
            required
            className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm leading-6 outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground" htmlFor="categoryId">
            카테고리
          </label>
          <select
            id="categoryId"
            name="categoryId"
            ref={categoryRef}
            required
            value={values.categoryId}
            onChange={(event) => setValues({ ...values, categoryId: event.target.value })}
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

        {state.message && (
          <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {state.message}{state.status === "auth" && <> <a href="/login" target="_blank" rel="noopener noreferrer" className="font-semibold underline">로그인 열기 (새 창)</a></>}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
          <Link
            href="/admin/posts"
            className="inline-flex h-11 items-center border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:border-accent"
          >
            취소
          </Link>
          <PendingButton
            name="intent"
            value="draft"
            disabled={!hasCategories}
            pendingLabel="저장 중…"
            className="inline-flex h-11 items-center border border-border bg-surface px-5 text-sm font-semibold text-primary-dark hover:border-primary disabled:hover:border-border"
          >
            임시저장
          </PendingButton>
          <PendingButton
            name="intent"
            value="publish"
            disabled={!hasCategories}
            pendingLabel="공개 중…"
            className="inline-flex h-11 items-center border border-primary bg-primary-dark px-5 text-sm font-semibold text-white hover:bg-primary disabled:hover:bg-primary-dark"
          >
            {post ? "저장 후 공개" : "공개하기"}
          </PendingButton>
        </div>
      </form>
  );
}
