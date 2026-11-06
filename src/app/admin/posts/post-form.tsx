"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import styles from "@/components/posts/post-editor.module.css";
import { PendingButton } from "@/components/ui/pending-button";
import { createPost, updatePost, type PostFormState } from "./actions";

type Category = { id: number; name: string; postType: string };
type Post = { id: number; title: string; status: string; content: string; categoryId: number | null };

const initialState: PostFormState = { status: "idle", message: "" };

export function PostForm({ categories, post }: { categories: Category[]; post?: Post }) {
  const [state, formAction, pending] = useActionState(async (previous: PostFormState, formData: FormData) => {
    // A named "id" input shadows form.id and drops React's submitter intent.
    if (post) formData.set("id", String(post.id));
    return post ? updatePost(previous, formData) : createPost(previous, formData);
  }, initialState);
  const [values, setValues] = useState({
    title: post?.title ?? "", content: post?.content ?? "",
    categoryId: post?.categoryId?.toString() ?? "",
  });
  const categoryRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (categoryRef.current) categoryRef.current.value = values.categoryId;
  }, [state, values.categoryId]);
  const hasCategories = categories.length > 0;

  return (
    <form action={formAction} className={styles.form} aria-busy={pending}>
      <div className={styles.toolbar}>
        <p className={styles.state}>
          {post ? post.status === "PUBLISHED" ? "현재 공개 중" : "현재 임시저장" : "새 글"}
        </p>
        <div className={styles.actions}>
          <Link href="/admin/posts" aria-disabled={pending} onClick={(event) => { if (pending) event.preventDefault(); }}>취소</Link>
          <PendingButton name="intent" value="draft" disabled={!hasCategories} pendingLabel="저장 중…" className={styles.secondaryButton}>
            임시저장
          </PendingButton>
          <PendingButton name="intent" value="publish" disabled={!hasCategories} pendingLabel="공개 중…" className={styles.primaryButton}>
            {post ? "저장 후 공개" : "공개하기"}
          </PendingButton>
        </div>
      </div>
      {state.message && (
        <p role="alert" className={`${styles.feedback} border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900`}>
          {state.message}{state.status === "auth" && <> <a href="/login" target="_blank" rel="noopener noreferrer" className="font-semibold underline">로그인 열기 (새 창)</a></>}
        </p>
      )}
      <fieldset disabled={pending} className={styles.fields}>
        <legend className="sr-only">게시글 작성</legend>
        <div className={styles.grid}>
          <div className={styles.manuscript}>
            <label htmlFor="title">제목</label>
            <textarea id="title" name="title" rows={2} required value={values.title}
              onChange={(event) => setValues({ ...values, title: event.target.value })}
              placeholder="글 제목을 입력하세요" className={styles.title} />
            <div className={styles.bodyField}>
              <label htmlFor="content">본문</label>
              <textarea id="content" name="content" rows={18} required value={values.content}
                onChange={(event) => setValues({ ...values, content: event.target.value })}
                placeholder="본문을 작성하세요" className={styles.content} />
            </div>
          </div>
          <aside className={styles.sidebar} aria-label="게시 설정">
            <div className={styles.panel}>
              <label className="block text-sm font-semibold" htmlFor="categoryId">게시판 · 카테고리</label>
              <select id="categoryId" name="categoryId" ref={categoryRef} required value={values.categoryId}
                onChange={(event) => setValues({ ...values, categoryId: event.target.value })}
                disabled={!hasCategories} className="mt-3 w-full rounded border border-border bg-white px-3 py-3 text-sm">
                <option value="">선택</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.postType === "NOTICE" ? "공지사항" : "홍보자료"} / {category.name}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-xs leading-5 text-muted">선택한 게시판에 글이 등록됩니다. 공개하기를 누르면 바로 표시됩니다.</p>
              {!hasCategories && <p className="mt-3 text-sm text-red-700">활성 카테고리가 없습니다. 먼저 seed 또는 관리자 카테고리 데이터를 확인해주세요.</p>}
            </div>
          </aside>
        </div>
      </fieldset>
    </form>
  );
}
