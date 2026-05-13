import type { Metadata } from "next";
import { connection } from "next/server";
import { PostType } from "@/generated/prisma/enums";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "홍보자료",
  description: "문선명 연구소 출범 준비 관련 홍보자료 목록입니다.",
};

export default async function MaterialsPage() {
  await connection();
  const materials = await getPublishedPosts(PostType.PROMOTION);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-neutral-200 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-700">홍보자료</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950">
            출범 준비 자료
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-neutral-600">
          연구소 출범 전 공유할 소개 자료와 안내 자료를 관리형 게시판으로
          제공합니다.
        </p>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {materials.length > 0 ? materials.map((post) => (
          <article key={post.id} className="border border-neutral-200 bg-white p-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <span>{post.publishedAt}</span>
              <span className="border border-neutral-200 px-2 py-1 text-xs font-semibold text-stone-700">
                {post.category}
              </span>
              {post.isPinned ? (
                <span className="border border-neutral-300 bg-stone-100 px-2 py-1 text-xs font-semibold text-neutral-700">
                  고정
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-neutral-950">
              {post.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              {post.summary}
            </p>
          </article>
        )) : (
          <div className="border border-neutral-200 bg-white px-5 py-10 text-sm text-neutral-500 md:col-span-2">
            등록된 홍보자료가 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
