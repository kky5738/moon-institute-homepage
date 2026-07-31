import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PostType } from "@/generated/prisma/enums";
import { getPublishedPostBySlug } from "@/lib/posts";

type ResearchDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ResearchDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(PostType.RESEARCH, slug);

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
  const post = await getPublishedPostBySlug(PostType.RESEARCH, slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-14 lg:px-8">
      <Link
        href="/research"
        className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
      >
        연구 게시판 목록
      </Link>
      <div className="mt-6 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>{post.authorName ?? "탈퇴한 회원"}</span>
          <span>{post.publishedAt}</span>
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          {post.title}
        </h1>
        {post.summary ? (
          <p className="mt-5 text-base leading-7 text-muted">{post.summary}</p>
        ) : null}
      </div>
      <div className="whitespace-pre-line py-8 text-base leading-8 text-foreground">
        {post.content}
      </div>
    </article>
  );
}
