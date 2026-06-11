import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PostType } from "@/generated/prisma/enums";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "공지사항",
  description: "문선명 연구소 공지사항 목록입니다.",
};

export default async function NoticesPage() {
  await connection();
  const notices = await getPublishedPosts(PostType.NOTICE);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">공지사항</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            연구소 소식과 안내
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted">
          출범 준비 과정의 주요 안내와 운영 소식을 공개된 순서대로
          정리합니다.
        </p>
      </div>

      <section className="mt-8 divide-y divide-border border-y border-border bg-surface">
        {notices.length > 0 ? notices.map((notice) => (
          <article
            key={notice.id}
            className="grid gap-4 px-5 py-6 md:grid-cols-[140px_1fr] md:px-6"
          >
            <div className="text-sm text-muted">
              <p>{notice.publishedAt}</p>
              <p className="mt-2 inline-flex border border-border px-2 py-1 text-xs font-semibold text-primary">
                {notice.category}
              </p>
              <p className="mt-2 text-xs text-muted">{notice.phase}</p>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {notice.isPinned ? (
                  <span className="border border-border bg-[#f1eef8] px-2 py-1 text-xs font-semibold text-primary-dark">
                    고정
                  </span>
                ) : null}
                <h2 className="text-xl font-semibold text-foreground">
                  <Link href={`/notices/${notice.slug}`} className="hover:text-primary hover:underline">
                    {notice.title}
                  </Link>
                </h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                {notice.summary}
              </p>
            </div>
          </article>
        )) : (
          <div className="px-5 py-10 text-sm text-muted md:px-6">
            등록된 공지사항이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
