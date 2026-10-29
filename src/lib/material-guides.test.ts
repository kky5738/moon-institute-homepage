import assert from "node:assert/strict";
import test from "node:test";
import { getMaterialArchiveItems, getRecommendedMaterialPosts } from "@/lib/material-guides";
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


test("추천은 해설에 지정된 공개 자료만 연결한다", () => {
  const recommended = { ...basePost, id: 2, slug: "words-research-material-guide" };
  assert.deepEqual(getRecommendedMaterialPosts(basePost.slug, [basePost, recommended]).map((post) => post.slug), [recommended.slug]);
  assert.deepEqual(getRecommendedMaterialPosts(basePost.slug, [basePost]), []);
  assert.deepEqual(getRecommendedMaterialPosts("new-material", [recommended]), []);
});
