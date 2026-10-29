import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
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
      where: {
        isActive: true,
      },
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
    <div className="mx-auto w-full max-w-3xl px-5 py-14 lg:px-8">
      <Link href="/admin/posts" className="text-sm font-semibold text-primary hover:underline">
        게시글 목록
      </Link>
      <div className="mt-6 border-b border-border pb-8">
        <p className="text-sm font-semibold text-primary">관리자</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          새 게시글 작성
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          카테고리를 선택하면 공지사항 또는 홍보자료 게시판에 연결됩니다.
        </p>
      </div>

      <PostForm categories={categories} />
    </div>
  );
}
