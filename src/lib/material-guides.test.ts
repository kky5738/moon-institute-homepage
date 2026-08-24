import assert from "node:assert/strict";
import test from "node:test";
import { getMaterialArchiveItems } from "@/lib/material-guides";
import type { BoardPost } from "@/lib/posts";

const basePost: BoardPost = {
  id: 1,
  title: "자료",
  slug: "life-research-material-guide",
  category: "생애 자료",
  categorySlug: "life-materials",
  summary: "요약",
  publishedAt: "2026-07-30",
  isPinned: false,
  authorName: null,
  attachmentCount: 0,
};

test("해설이 명시된 홍보자료만 자료 아카이브에 포함한다", () => {
  const items = getMaterialArchiveItems([
    basePost,
    { ...basePost, id: 2, slug: "unselected-promotion" },
  ]);

  assert.deepEqual(
    items.map((item) => item.post.slug),
    ["life-research-material-guide"],
  );
});
