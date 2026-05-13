import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PostType } from "@/generated/prisma/enums";
import { getPublishedPostBySlug } from "@/lib/posts";

type MaterialDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: MaterialDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(PostType.PROMOTION, slug);

  return {
    title: post?.title ?? "홍보자료",
    description: post?.summary ?? "문선명 연구소 홍보자료입니다.",
  };
}

export default async function MaterialDetailPage({
  params,
}: MaterialDetailPageProps) {
  await connection();
  const { slug } = await params;
  const post = await getPublishedPostBySlug(PostType.PROMOTION, slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-14 lg:px-8">
      <Link href="/materials" className="text-sm font-semibold text-stone-700 hover:underline">
        홍보자료 목록
      </Link>
      <div className="mt-6 border-b border-neutral-200 pb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          <span>{post.publishedAt}</span>
          <span className="border border-neutral-200 px-2 py-1 text-xs font-semibold text-stone-700">
            {post.category}
          </span>
          <span>{post.phase}</span>
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950">
          {post.title}
        </h1>
        <p className="mt-5 text-base leading-7 text-neutral-600">{post.summary}</p>
      </div>
      <div className="whitespace-pre-line py-8 text-base leading-8 text-neutral-700">
        {post.content}
      </div>
    </article>
  );
}
