import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDocument } from "@/components/posts/PostDocument";
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
  const post = await getPublishedPostBySlug(PostType.NOTICE, slug);

  if (!post) {
    notFound();
  }

  return (
    <PostDocument post={post} backHref="/notices" backLabel="공지사항">
      <div className="whitespace-pre-wrap break-words">{post.content}</div>
    </PostDocument>
  );
}
