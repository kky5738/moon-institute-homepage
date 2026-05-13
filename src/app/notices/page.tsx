import type { Metadata } from "next";
import { connection } from "next/server";
import { PostType } from "@/generated/prisma/enums";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "공지사항",
  description: "문선명 연구소 출범 준비 관련 공지사항 목록입니다.",
};

export default async function NoticesPage() {
  await connection();
  const notices = await getPublishedPosts(PostType.NOTICE);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-neutral-200 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-700">공지사항</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950">
            연구소 소식과 안내
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-neutral-600">
          관리자 작성 기능이 붙기 전까지는 Prisma seed 데이터로 목록 구조를
          확인합니다.
        </p>
      </div>

      <section className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200 bg-white">
        {notices.length > 0 ? notices.map((notice) => (
          <article
            key={notice.id}
            className="grid gap-4 px-5 py-6 md:grid-cols-[140px_1fr] md:px-6"
          >
            <div className="text-sm text-neutral-500">
              <p>{notice.publishedAt}</p>
              <p className="mt-2 inline-flex border border-neutral-200 px-2 py-1 text-xs font-semibold text-stone-700">
                {notice.category}
              </p>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {notice.isPinned ? (
                  <span className="border border-neutral-300 bg-stone-100 px-2 py-1 text-xs font-semibold text-neutral-700">
                    고정
                  </span>
                ) : null}
                <h2 className="text-xl font-semibold text-neutral-950">
                  {notice.title}
                </h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {notice.summary}
              </p>
            </div>
          </article>
        )) : (
          <div className="px-5 py-10 text-sm text-neutral-500 md:px-6">
            등록된 공지사항이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
