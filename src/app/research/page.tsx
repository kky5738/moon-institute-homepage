import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { buttonVariants } from "@/components/ui/button";
import { PostType } from "@/generated/prisma/enums";
import { getPublishedPosts } from "@/lib/posts";
import { getApprovedResearcher } from "@/lib/researcher-auth";

export const metadata: Metadata = {
  title: "연구 게시판",
  description: "연구소 회원들이 공개한 연구 글 목록입니다.",
};

export default async function ResearchPage() {
  await connection();
  const [posts, user] = await Promise.all([
    getPublishedPosts(PostType.RESEARCH),
    getApprovedResearcher(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">연구 게시판</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            회원 연구 글
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            연구소의 승인된 회원들이 작성해 공개한 글을 최신순으로 확인합니다.
          </p>
        </div>
        {user ? (
          <Link
            href="/account/posts/new"
            className={buttonVariants({ className: "w-full sm:w-auto" })}
          >
            새 글 작성
          </Link>
        ) : null}
      </div>

      <section className="mt-8 border-y border-border bg-surface">
        <div className="hidden grid-cols-[100px_1fr_140px_120px] border-b border-border px-5 py-3 text-xs font-semibold text-muted sm:grid">
          <span>번호</span>
          <span>제목</span>
          <span>작성자</span>
          <span>작성일</span>
        </div>
        {posts.length > 0 ? (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <article
                key={post.id}
                className="grid gap-2 px-5 py-5 sm:grid-cols-[100px_1fr_140px_120px] sm:items-center"
              >
                <span className="hidden text-sm text-muted sm:block">{post.id}</span>
                <div>
                  <Link
                    href={`/research/${post.slug}`}
                    className="font-semibold text-foreground hover:text-primary hover:underline"
                  >
                    {post.title}
                  </Link>
                  {post.summary ? (
                    <p className="mt-2 line-clamp-1 text-sm text-muted">
                      {post.summary}
                    </p>
                  ) : null}
                </div>
                <span className="text-sm text-muted">
                  {post.authorName ?? "탈퇴한 회원"}
                </span>
                <time className="text-sm text-muted">{post.publishedAt}</time>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-sm text-muted">
            공개된 연구 글이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
