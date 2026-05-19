import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { archivePost } from "./actions";

export const metadata: Metadata = {
  title: "게시글 관리",
  description: "공지사항과 홍보자료 게시글을 관리합니다.",
};

export default async function AdminPostsPage() {
  await connection();

  let posts;

  try {
    posts = await prisma.post.findMany({
      include: {
        category: true,
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });
  } catch (error) {
    logServerError("admin.posts.list", error);
    throw error;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-neutral-200 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-700">관리자</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950">
            게시글 관리
          </h1>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          새 게시글
        </Link>
      </div>

      <section className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200 bg-white">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article
              key={post.id}
              className="grid gap-4 px-5 py-5 md:grid-cols-[160px_1fr_240px] md:px-6"
            >
              <div className="text-sm text-neutral-500">
                <p>{post.type === "NOTICE" ? "공지사항" : "홍보자료"}</p>
                <p className="mt-2">{post.category?.name ?? "카테고리 없음"}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-neutral-500">/{post.slug}</p>
                {post.summary ? (
                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    {post.summary}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <div className="flex flex-wrap items-start gap-2 text-xs font-semibold md:justify-end">
                  <span className="border border-neutral-200 px-2 py-1 text-neutral-600">
                    {post.status}
                  </span>
                  <span className="border border-neutral-200 px-2 py-1 text-neutral-600">
                    {post.phase}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="inline-flex h-9 items-center border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 hover:border-neutral-950 hover:text-neutral-950"
                  >
                    수정
                  </Link>
                  {post.status !== "ARCHIVED" ? (
                    <form action={archivePost}>
                      <input type="hidden" name="id" value={post.id} />
                      <button
                        type="submit"
                        className="inline-flex h-9 cursor-pointer items-center border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 hover:border-neutral-950 hover:text-neutral-950"
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
          <div className="px-5 py-10 text-sm text-neutral-500 md:px-6">
            등록된 게시글이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
