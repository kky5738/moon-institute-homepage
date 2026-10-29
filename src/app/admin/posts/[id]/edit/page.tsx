import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PendingButton } from "@/components/ui/pending-button";
import { PostStatus, PostType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminEditableCategoriesWhere } from "@/lib/admin-posts";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { archivePost } from "../../actions";
import { PostForm } from "../../post-form";

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
      prisma.post.findUnique({
        where: { id },
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
    <div className="mx-auto w-full max-w-3xl px-5 py-14 lg:px-8">
      <Link href="/admin/posts" className="text-sm font-semibold text-primary hover:underline">
        게시글 목록
      </Link>
      <div className="mt-6 border-b border-border pb-8">
        <p className="text-sm font-semibold text-primary">관리자</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          게시글 수정
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          게시글 내용을 수정하거나 공개 상태를 보관으로 변경합니다.
        </p>
      </div>

      <PostForm categories={categories} post={{
        id: post.id, title: post.title, slug: post.slug, summary: post.summary,
        content: post.content, categoryId: post.categoryId,
      }} />

      {post.status !== PostStatus.ARCHIVED ? (
        <form action={archivePost} className="mt-4 flex justify-end">
          <input type="hidden" name="id" value={post.id} />
          <PendingButton
            pendingLabel="보관 중…"
            className="inline-flex h-10 items-center border border-border bg-surface px-4 text-sm font-semibold text-primary-dark hover:border-primary hover:text-foreground disabled:hover:border-border disabled:hover:text-primary-dark"
          >
            게시글 보관
          </PendingButton>
        </form>
      ) : null}
    </div>
  );
}
