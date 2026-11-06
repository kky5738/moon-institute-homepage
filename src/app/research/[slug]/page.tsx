import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ResearchPostContent } from "@/components/research/ResearchPostContent";
import { PostType } from "@/generated/prisma/enums";
import { PostDocument } from "@/components/posts/PostDocument";
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

  return (
    <PostDocument post={{ ...post, authorName: post.authorName ?? "탈퇴한 회원" }} backHref="/research" backLabel="연구 게시판"
      tools={<Suspense fallback={null}><ResearchEditLink postId={post.id} authorId={post.authorId} /></Suspense>}>
      <ResearchPostContent content={post.content} attachments={post.attachments} />
    </PostDocument>
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
