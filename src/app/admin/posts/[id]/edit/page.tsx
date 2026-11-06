import type { Metadata } from "next";
import { PostEditorShell } from "@/components/posts/PostEditorShell";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PendingButton } from "@/components/ui/pending-button";
import { PostStatus, PostType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminEditableCategoriesWhere, getAdminEditablePostWhere } from "@/lib/admin-posts";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { archivePost } from "../../actions";
import { PostForm } from "../../post-form";
import { DeletePostButton } from "../../delete-post-button";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "게시글 수정",
  description: "공지사항 또는 홍보자료 게시글을 수정합니다.",
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  await connection();
  await requireAdmin();

  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  let post;
  let categories;

  try {
    [post, categories] = await Promise.all([
      prisma.post.findFirst({
        where: getAdminEditablePostWhere(id),
        include: {
          category: true,
        },
      }),
      prisma.category.findMany({
        where: getAdminEditableCategoriesWhere(),
        orderBy: [
          { postType: "asc" },
          { sortOrder: "asc" },
          { name: "asc" },
        ],
      }),
    ]);
  } catch (error) {
    logServerError("admin.posts.edit.load", error, { id });
    throw error;
  }

  if (!post || post.type === PostType.RESEARCH) {
    notFound();
  }

  return (
    <PostEditorShell title="게시글 수정" backHref="/admin/posts" backLabel="게시글 목록">
      <PostForm categories={categories} post={{
        id: post.id, title: post.title, status: post.status,
        content: post.content, categoryId: post.categoryId,
      }} />

      {post.status === PostStatus.ARCHIVED ? (
        <div className="mt-4 flex justify-end"><DeletePostButton id={post.id} title={post.title} /></div>
      ) : (
        <form action={archivePost} className="mt-4 flex justify-end">
          <input type="hidden" name="id" value={post.id} />
          <PendingButton
            pendingLabel="보관 중…"
            className="inline-flex h-10 items-center border border-border bg-surface px-4 text-sm font-semibold text-primary-dark hover:border-primary hover:text-foreground disabled:hover:border-border disabled:hover:text-primary-dark"
          >
            게시글 보관
          </PendingButton>
        </form>
      )}
    </PostEditorShell>
  );
}
