import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PostType } from "@/generated/prisma/enums";
import {
  getPublishedPostBySlug,
  getPublishedPostMetadataBySlug,
} from "@/lib/posts";

type NoticeDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: NoticeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostMetadataBySlug(PostType.NOTICE, slug);

  return {
    title: post?.title ?? "공지사항",
    description: post?.summary ?? "문선명 연구소 공지사항입니다.",
  };
}

export default async function NoticeDetailPage({
  params,
}: NoticeDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(PostType.NOTICE, slug, false);

  if (!post) {
    notFound();
  }

  return (
    <article className="board-page mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <Link href="/notices" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-foreground hover:underline">
        ← 공지사항
      </Link>
      <header className="mt-8 border-b border-border pb-8 sm:mt-10 sm:pb-10">
        <p className="text-xs font-semibold tracking-wide text-muted">{post.category}</p>
        <h1 className="board-heading mt-4 text-3xl font-semibold leading-snug tracking-tight text-foreground sm:text-4xl sm:leading-snug">
          {post.title}
        </h1>
        {post.summary ? <p className="board-heading mt-5 text-base leading-7 text-muted">{post.summary}</p> : null}
        <p className="mt-7 text-sm text-muted">게시일 <time className="ml-3">{post.publishedAt}</time></p>
      </header>
      <div className="whitespace-pre-wrap break-words py-10 text-base leading-8 text-foreground sm:py-12 lg:text-[17px] lg:leading-9">
        {post.content}
      </div>
      <nav aria-label="게시글 탐색" className="border-t border-border pt-6">
        <Link href="/notices" className={buttonVariants({ variant: "outline" })}>
          공지사항 목록
        </Link>
      </nav>
    </article>
  );
}
