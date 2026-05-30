import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PostType } from "@/generated/prisma/enums";
import { getPublishedPostBySlug } from "@/lib/posts";

type NoticeDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: NoticeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(PostType.NOTICE, slug);

  return {
    title: post?.title ?? "공지사항",
    description: post?.summary ?? "문선명 연구소 공지사항입니다.",
  };
}

export default async function NoticeDetailPage({
  params,
}: NoticeDetailPageProps) {
  await connection();
  const { slug } = await params;
  const post = await getPublishedPostBySlug(PostType.NOTICE, slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-14 lg:px-8">
      <Link href="/notices" className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
        공지사항 목록
      </Link>
      <div className="mt-6 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{post.publishedAt}</span>
          <span className="border border-border px-2 py-1 text-xs font-semibold text-primary">
            {post.category}
          </span>
          <span>{post.phase}</span>
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          {post.title}
        </h1>
        <p className="mt-5 text-base leading-7 text-muted">{post.summary}</p>
      </div>
      <div className="whitespace-pre-line py-8 text-base leading-8 text-foreground">
        {post.content}
      </div>
    </article>
  );
}
