import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ResearchPostContent } from "@/components/research/ResearchPostContent";
import { AttachmentKind, PostType } from "@/generated/prisma/enums";
import { formatResearchFileSize } from "@/lib/research-files";
import {
  getPublishedPostBySlug,
  getPublishedPostMetadataBySlug,
} from "@/lib/posts";
import { canEditResearchPost } from "@/lib/research-posts";
import { getApprovedResearcher } from "@/lib/researcher-auth";

type ResearchDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ResearchDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostMetadataBySlug(PostType.RESEARCH, slug);

  return {
    title: post?.title ?? "연구 게시판",
    description: post?.summary ?? "연구소 회원이 작성한 연구 글입니다.",
  };
}

export default async function ResearchDetailPage({
  params,
}: ResearchDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(PostType.RESEARCH, slug);

  if (!post) {
    notFound();
  }

  const files = post.attachments.filter(
    (file) => file.kind === AttachmentKind.ATTACHMENT,
  );

  return (
    <article className="board-page mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/research"
          className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-foreground hover:underline"
        >
          ← 연구 게시판
        </Link>
        <Suspense fallback={null}>
          <ResearchEditLink
            postId={post.id}
            authorId={post.authorId}
          />
        </Suspense>
      </div>
      <header className="mt-8 border-b border-border pb-8 sm:mt-10 sm:pb-10">
        <p className="text-xs font-semibold tracking-wide text-muted">연구 글</p>
        <h1 className="board-heading mt-4 text-3xl font-semibold leading-snug tracking-tight text-foreground sm:text-4xl sm:leading-snug">
          {post.title}
        </h1>
        {post.summary ? (
          <p className="board-heading mt-5 text-base leading-7 text-muted">
            {post.summary}
          </p>
        ) : null}
        <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-2 text-sm">
          <div className="flex gap-3 py-1">
            <dt className="font-normal text-muted">작성자</dt>
            <dd className="text-muted">{post.authorName ?? "탈퇴한 회원"}</dd>
          </div>
          <div className="flex gap-3 py-1">
            <dt className="font-normal text-muted">작성일</dt>
            <dd className="text-muted">{post.publishedAt}</dd>
          </div>
        </dl>
      </header>
      <div className="w-full py-10 sm:py-12">
        <ResearchPostContent content={post.content} attachments={post.attachments} />
      </div>
        {files.length > 0 ? (
          <section className="mb-10 rounded-lg bg-secondary p-5 sm:p-6" aria-labelledby="attachments-title">
            <h2 id="attachments-title" className="text-sm font-semibold text-foreground">
              첨부파일
            </h2>
            <ul className="mt-2 space-y-2 text-sm">
              {files.map((file) => (
                <li key={file.id}>
                  {file.url ? (
                    <a
                      href={file.url}
                      className="flex min-h-11 items-center justify-between gap-4 font-semibold text-primary-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="break-all">{file.originalName}</span>
                      <span className="shrink-0 font-normal text-muted">
                        {formatResearchFileSize(file.size)}
                      </span>
                    </a>
                  ) : (
                    <span className="break-all text-muted">{file.originalName}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      <nav aria-label="게시글 탐색" className="border-t border-border pt-6">
        <Link href="/research" className={buttonVariants({ variant: "outline" })}>
          연구 게시판 목록
        </Link>
      </nav>
    </article>
  );
}

async function ResearchEditLink({
  postId,
  authorId,
}: {
  postId: number;
  authorId: number | null;
}) {
  const user = await getApprovedResearcher();

  return canEditResearchPost(user?.id ?? null, authorId) ? (
    <Link
      href={`/account/posts/${postId}/edit`}
      className={buttonVariants({ variant: "outline" })}
    >
      수정
    </Link>
  ) : null;
}
