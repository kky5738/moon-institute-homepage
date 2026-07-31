import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PostStatus, PostType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireResearcher } from "@/lib/researcher-auth";
import { logServerError } from "@/lib/server-log";

export const metadata: Metadata = {
  title: "내 글",
  description: "작성한 연구 글과 임시저장 글을 관리합니다.",
};

export default async function AccountPostsPage() {
  await connection();
  const user = await requireResearcher();

  let posts;

  try {
    posts = await prisma.post.findMany({
      where: {
        authorId: user.id,
        type: PostType.RESEARCH,
        deletedAt: null,
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });
  } catch (error) {
    logServerError("researcher.posts.list", error, { userId: user.id });
    throw error;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/account"
            className="text-sm font-semibold text-primary hover:underline"
          >
            내 계정
          </Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            내 글
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            임시저장하거나 연구 게시판에 바로 공개한 글을 관리합니다.
          </p>
        </div>
        <Link href="/account/posts/new" className={buttonVariants()}>
          새 글 작성
        </Link>
      </div>

      <section className="mt-8 divide-y divide-border border-y border-border bg-surface">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article
              key={post.id}
              className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>
                    {post.status === PostStatus.PUBLISHED
                      ? "공개"
                      : post.status === PostStatus.DRAFT
                        ? "임시저장"
                        : "관리자 보관"}
                  </span>
                  <span>{post.updatedAt.toISOString().slice(0, 10)} 수정</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  {post.title}
                </h2>
                {post.summary ? (
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {post.summary}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                {post.status === PostStatus.PUBLISHED ? (
                  <Link
                    href={`/research/${post.slug}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    보기
                  </Link>
                ) : null}
                {post.status !== PostStatus.ARCHIVED ? (
                  <Link
                    href={`/account/posts/${post.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    수정
                  </Link>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <Card className="rounded-none border-0 p-8 text-sm text-muted shadow-none">
            작성한 글이 없습니다.
          </Card>
        )}
      </section>
    </div>
  );
}
