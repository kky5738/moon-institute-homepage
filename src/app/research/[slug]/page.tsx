import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
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
  await connection();
  const { slug } = await params;
  const [post, user] = await Promise.all([
    getPublishedPostBySlug(PostType.RESEARCH, slug),
    getApprovedResearcher(),
  ]);

  if (!post) {
    notFound();
  }

  const files = post.attachments.filter(
    (file) => file.kind === AttachmentKind.ATTACHMENT,
  );

  return (
    <article className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/research"
          className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
        >
          연구 게시판 목록
        </Link>
        {canEditResearchPost(user?.id ?? null, post.authorId) ? (
          <Link
            href={`/account/posts/${post.id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            수정
          </Link>
        ) : null}
      </div>
      <header className="mt-6 border-y border-border bg-surface px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm font-semibold text-primary">연구 글</p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-foreground [word-break:keep-all] sm:text-3xl lg:text-4xl">
          {post.title}
        </h1>
        {post.summary ? (
          <p className="mt-4 max-w-4xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
            {post.summary}
          </p>
        ) : null}
        <dl className="mt-6 grid border-t border-border pt-4 text-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr]">
          <div className="flex gap-3 py-1">
            <dt className="font-semibold text-foreground">작성자</dt>
            <dd className="text-muted">{post.authorName ?? "탈퇴한 회원"}</dd>
          </div>
          <div className="flex gap-3 py-1">
            <dt className="font-semibold text-foreground">작성일</dt>
            <dd className="text-muted">{post.publishedAt}</dd>
          </div>
          <div className="flex gap-3 py-1">
            <dt className="font-semibold text-foreground">첨부</dt>
            <dd className="text-muted">{files.length}개</dd>
          </div>
        </dl>
        {files.length > 0 ? (
          <section className="mt-5 border-t border-border pt-4" aria-labelledby="attachments-title">
            <h2 id="attachments-title" className="text-sm font-semibold text-foreground">
              첨부파일
            </h2>
            <ul className="mt-2 space-y-2 text-sm">
              {files.map((file) => (
                <li key={file.id}>
                  {file.url ? (
                    <a
                      href={file.url}
                      className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="break-all">{file.originalName}</span>
                      <span className="shrink-0 font-normal text-muted">
                        {formatResearchFileSize(file.size)}
                      </span>
                    </a>
                  ) : (
                    <span className="text-muted">{file.originalName}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </header>
      <div className="mx-auto w-full max-w-[78ch] py-10 sm:py-12">
        <ResearchPostContent content={post.content} attachments={post.attachments} />
      </div>
    </article>
  );
}
