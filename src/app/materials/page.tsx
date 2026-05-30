import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PostType } from "@/generated/prisma/enums";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "홍보자료",
  description: "문선명 연구소 관련 홍보자료 목록입니다.",
};

export default async function MaterialsPage() {
  await connection();
  const materials = await getPublishedPosts(PostType.PROMOTION);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">홍보자료</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            홍보 자료
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted">
          소개 자료와 안내 자료를 관리형 게시판으로 제공합니다.
        </p>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {materials.length > 0 ? materials.map((post) => (
          <article key={post.id} className="border border-border bg-surface p-6 shadow-sm shadow-primary-dark/5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{post.publishedAt}</span>
              <span className="border border-border px-2 py-1 text-xs font-semibold text-primary">
                {post.category}
              </span>
              {post.isPinned ? (
                <span className="border border-border bg-[#f1eef8] px-2 py-1 text-xs font-semibold text-primary-dark">
                  고정
                </span>
              ) : null}
              <span>{post.phase}</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              <Link href={`/materials/${post.slug}`} className="hover:text-primary hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {post.summary}
            </p>
          </article>
        )) : (
          <div className="border border-border bg-surface px-5 py-10 text-sm text-muted md:col-span-2">
            등록된 홍보자료가 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
