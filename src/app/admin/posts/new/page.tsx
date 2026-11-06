import type { Metadata } from "next";
import { PostEditorShell } from "@/components/posts/PostEditorShell";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminEditableCategoriesWhere } from "@/lib/admin-posts";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { PostForm } from "../post-form";

export const metadata: Metadata = {
  title: "새 게시글",
  description: "공지사항 또는 홍보자료 게시글을 작성합니다.",
};

export default async function NewPostPage() {
  await connection();
  await requireAdmin();

  let categories;

  try {
    categories = await prisma.category.findMany({
      where: getAdminEditableCategoriesWhere(),
      orderBy: [
        { postType: "asc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });
  } catch (error) {
    logServerError("admin.posts.new.categories", error);
    throw error;
  }

  return (
    <PostEditorShell title="새 게시글" backHref="/admin/posts" backLabel="게시글 목록">
      <PostForm categories={categories} />
    </PostEditorShell>
  );
}
