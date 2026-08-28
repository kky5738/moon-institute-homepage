import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/site/Pagination";
import { buttonVariants } from "@/components/ui/button";
import { PostType } from "@/generated/prisma/enums";
import { parsePageParam } from "@/lib/pagination";
import { getPublishedPostPage } from "@/lib/posts";
import { getApprovedResearcher } from "@/lib/researcher-auth";

export const metadata: Metadata = {
  title: "연구 게시판",
  description: "연구소 회원들이 공개한 연구 글 목록입니다.",
};

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const requestedPage = parsePageParam((await searchParams).page);
  const { posts, page, totalPages, totalItems, offset } =
    await getPublishedPostPage(PostType.RESEARCH, requestedPage);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">연구 게시판</p>
          <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            회원 연구 글
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            연구소의 승인된 회원들이 작성해 공개한 글을 최신순으로 확인합니다.
          </p>
        </div>
        <Suspense fallback={null}>
          <ResearchCreateLink />
        </Suspense>
      </div>

      <section className="mt-8 border-y border-border bg-surface" aria-label="연구 글 목록">
        <div className="hidden grid-cols-[72px_minmax(0,1fr)_72px_120px_110px] border-b border-border bg-background px-4 py-3 text-xs font-semibold text-muted md:grid">
          <span className="text-center">번호</span>
          <span>제목</span>
          <span className="text-center">첨부</span>
          <span>작성자</span>
          <span>작성일</span>
        </div>
        {posts.length > 0 ? (
          <div className="divide-y divide-border">
            {posts.map((post, index) => (
              <article
                key={post.id}
                className="group grid gap-2 px-4 py-4 transition-colors hover:bg-secondary/35 md:min-h-14 md:grid-cols-[72px_minmax(0,1fr)_72px_120px_110px] md:items-center md:gap-0 md:py-3"
              >
                <span className="hidden text-center text-sm text-muted md:block">
                  {totalItems - offset - index}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/research/${post.slug}`}
                    className="block truncate font-semibold text-foreground underline-offset-4 group-hover:text-primary-dark group-hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {post.title}
                  </Link>
                </div>
                <span className="hidden text-center text-xs text-muted md:block">
                  {post.attachmentCount > 0 ? post.attachmentCount : "-"}
                </span>
                <span className="hidden truncate text-sm text-muted md:block">
                  {post.authorName ?? "탈퇴한 회원"}
                </span>
                <time className="hidden text-sm text-muted md:block">
                  {post.publishedAt}
                </time>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted md:hidden">
                  <span>{post.authorName ?? "탈퇴한 회원"}</span>
                  <span aria-hidden="true">·</span>
                  <time>{post.publishedAt}</time>
                  {post.attachmentCount > 0 ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>첨부 {post.attachmentCount}</span>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-sm text-muted">
            공개된 연구 글이 없습니다.
          </div>
        )}
      </section>
      <Pagination basePath="/research" page={page} totalPages={totalPages} />
    </div>
  );
}

async function ResearchCreateLink() {
  const user = await getApprovedResearcher();

  return user ? (
    <Link
      href="/account/posts/new"
      className={buttonVariants({ className: "w-full sm:w-auto" })}
    >
      새 글 작성
    </Link>
  ) : null;
}
