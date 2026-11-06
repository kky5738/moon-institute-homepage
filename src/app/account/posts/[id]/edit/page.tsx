import type { Metadata } from "next";
import { PostEditorShell } from "@/components/posts/PostEditorShell";
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
    <PostEditorShell title="연구 글 수정" backHref="/account/posts" backLabel="내 글 목록">
      <ResearchPostForm
        post={{
          id: post.id,
          title: post.title,
          status: post.status,
          content: post.content,
          attachments: post.attachments.map((file) => ({
            id: file.id,
            kind: file.kind,
            originalName: file.originalName,
            size: file.size,
            altText: file.altText,
            committed: file.committedAt !== null,
          })),
        }}
      />
    </PostEditorShell>
  );
}
