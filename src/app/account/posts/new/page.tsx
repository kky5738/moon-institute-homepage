import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { requireResearcher } from "@/lib/researcher-auth";
import { ResearchPostForm } from "../ResearchPostForm";

export const metadata: Metadata = {
  title: "새 연구 글",
  description: "연구 게시판에 올릴 글을 작성합니다.",
};

export default async function NewResearchPostPage() {
  await connection();
  await requireResearcher();

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
          새 글 작성
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          공개하기를 누르면 연구 게시판에 즉시 공개됩니다. 글 주소는 제목을
          바탕으로 자동 생성됩니다.
        </p>
      </div>

      <ResearchPostForm />
    </div>
  );
}
