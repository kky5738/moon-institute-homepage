import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/site/Pagination";
import { PostType } from "@/generated/prisma/enums";
import { parsePageParam } from "@/lib/pagination";
import { getPublishedPostPage } from "@/lib/posts";

export const metadata: Metadata = {
  title: "공지사항",
  description: "문선명 연구소 공지사항 목록입니다.",
};

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const requestedPage = parsePageParam((await searchParams).page);
  const { posts: notices, page, totalPages } = await getPublishedPostPage(
    PostType.NOTICE,
    requestedPage,
  );

  return (
    <div className="board-page mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-4 pb-10">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted">공지사항</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight lg:text-4xl text-foreground">
            연구소 소식과 안내
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          연구소의 주요 안내와 운영 소식을 공개된 순서대로 정리합니다.
        </p>
      </div>

      <section className="divide-y divide-border border-y border-border bg-surface" aria-label="공지사항 목록">
        {notices.length > 0 ? notices.map((notice) => (
          <article
            key={notice.id}
            className="group grid gap-3 px-4 py-7 transition-colors hover:bg-secondary md:grid-cols-[120px_minmax(0,1fr)] md:gap-8 md:py-8"
          >
            <div className="flex items-center gap-3 text-sm text-muted md:block">
              <time>{notice.publishedAt}</time>
              <p className="text-xs text-muted md:mt-2">
                {notice.category}
              </p>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {notice.isPinned ? (
                  <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-muted">
                    고정
                  </span>
                ) : null}
                <h2 className="board-heading text-lg font-semibold leading-7 text-foreground sm:text-xl">
                  <Link href={`/notices/${notice.slug}`} className="group-hover:text-primary hover:underline">
                    {notice.title}
                  </Link>
                </h2>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">
                {notice.summary}
              </p>
            </div>
          </article>
        )) : (
          <div className="px-5 py-20 text-center text-sm text-muted">
            등록된 공지사항이 없습니다.
          </div>
        )}
      </section>
      <Pagination basePath="/notices" page={page} totalPages={totalPages} />
    </div>
  );
}
