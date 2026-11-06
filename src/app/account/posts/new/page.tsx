import type { Metadata } from "next";
import { PostEditorShell } from "@/components/posts/PostEditorShell";
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
    <PostEditorShell title="새 연구 글" backHref="/account/posts" backLabel="내 글 목록">
      <ResearchPostForm />
    </PostEditorShell>
  );
}
