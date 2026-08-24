import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PostStatus, PostType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireResearcher } from "@/lib/researcher-auth";
import { logServerError } from "@/lib/server-log";
import { ResearchPostForm } from "../../ResearchPostForm";

type EditResearchPostPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "연구 글 수정",
  description: "작성한 연구 글을 수정합니다.",
};

export default async function EditResearchPostPage({
  params,
}: EditResearchPostPageProps) {
  await connection();
  const user = await requireResearcher();
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  let post;

  try {
    post = await prisma.post.findFirst({
      where: {
        id,
        authorId: user.id,
        type: PostType.RESEARCH,
        status: { not: PostStatus.ARCHIVED },
        deletedAt: null,
      },
      include: {
        attachments: {
          where: { deletedAt: null, uploadedAt: { not: null } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error) {
    logServerError("researcher.posts.edit.load", error, {
      id,
      userId: user.id,
    });
    throw error;
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link
        href="/account/posts"
        className="text-sm font-semibold text-primary hover:underline"
      >
        내 글 목록
      </Link>
      <div className="mt-6 border-b border-border pb-8">
        <p className="text-sm font-semibold text-primary">연구자 글쓰기</p>
        <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          글 수정
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          공개한 글도 임시저장으로 전환하면 게시판에서 즉시 내려갑니다.
        </p>
      </div>

      <ResearchPostForm
        post={{
          id: post.id,
          title: post.title,
          summary: post.summary,
          content: post.content,
          attachments: post.attachments.map((file) => ({
            id: file.id,
            kind: file.kind,
            originalName: file.originalName,
            size: file.size,
            altText: file.altText,
          })),
        }}
      />
    </div>
  );
}
