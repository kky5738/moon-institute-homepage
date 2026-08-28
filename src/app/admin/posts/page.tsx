import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Pagination } from "@/components/site/Pagination";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getPostPageWindow,
  parsePageParam,
  POSTS_PER_PAGE,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { archivePost } from "./actions";

export const metadata: Metadata = {
  title: "게시글 관리",
  description: "공지사항과 홍보자료 게시글을 관리합니다.",
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  await connection();
  await requireAdmin();
  const requestedPage = parsePageParam((await searchParams).page);
  const { posts, page, totalPages } = await getAdminPostPage(requestedPage);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">관리자</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            게시글 관리
          </h1>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex h-11 items-center justify-center border border-primary bg-primary-dark px-5 text-sm font-semibold text-white hover:bg-primary"
        >
          새 게시글
        </Link>
      </div>

      <section className="mt-8 divide-y divide-border border-y border-border bg-surface">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article
              key={post.id}
              className="grid gap-4 px-5 py-5 md:grid-cols-[160px_1fr_240px] md:px-6"
            >
              <div className="text-sm text-muted">
                <p>
                  {post.type === "NOTICE"
                    ? "공지사항"
                    : post.type === "PROMOTION"
                      ? "홍보자료"
                      : "회원 연구 글"}
                </p>
                <p className="mt-2">{post.category?.name ?? "카테고리 없음"}</p>
                {post.author ? (
                  <p className="mt-2">작성자: {post.author.name}</p>
                ) : null}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-muted">/{post.slug}</p>
                {post.summary ? (
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {post.summary}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <div className="flex flex-wrap items-start gap-2 text-xs font-semibold md:justify-end">
                  <span className="border border-border px-2 py-1 text-muted">
                    {post.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {post.type === "RESEARCH" ? (
                    post.status === "PUBLISHED" ? (
                      <Link
                        href={`/research/${post.slug}`}
                        className="inline-flex h-9 items-center border border-border bg-surface px-3 text-xs font-semibold text-primary-dark hover:border-primary hover:text-foreground"
                      >
                        보기
                      </Link>
                    ) : null
                  ) : (
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="inline-flex h-9 items-center border border-border bg-surface px-3 text-xs font-semibold text-primary-dark hover:border-primary hover:text-foreground"
                    >
                      수정
                    </Link>
                  )}
                  {post.status !== "ARCHIVED" ? (
                    <form action={archivePost}>
                      <input type="hidden" name="id" value={post.id} />
                      <button
                        type="submit"
                        className="inline-flex h-9 cursor-pointer items-center border border-border bg-surface px-3 text-xs font-semibold text-primary-dark hover:border-primary hover:text-foreground"
                      >
                        보관
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="px-5 py-10 text-sm text-muted md:px-6">
            등록된 게시글이 없습니다.
          </div>
        )}
      </section>
      <Pagination basePath="/admin/posts" page={page} totalPages={totalPages} />
    </div>
  );
}

async function getAdminPostPage(requestedPage: number) {
  try {
    const totalItems = await prisma.post.count();
    const pagination = getPostPageWindow(requestedPage, totalItems);
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        slug: true,
        summary: true,
        category: {
          select: {
            name: true,
          },
        },
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      skip: pagination.offset,
      take: POSTS_PER_PAGE,
    });

    return { ...pagination, posts };
  } catch (error) {
    logServerError("admin.posts.list", error);
    throw error;
  }
}
