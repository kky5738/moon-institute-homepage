import assert from "node:assert/strict";
import test from "node:test";
import { createPostSlug } from "@/lib/post-slug";
import { canEditResearchPost } from "@/lib/research-posts";

test("제목을 한글 URL 슬러그로 변환한다", () => {
  assert.equal(
    createPostSlug("연구 자료: 첫 번째 글", "A1B2C3D4"),
    "연구-자료-첫-번째-글-a1b2c3d4",
  );
});

test("제목에 사용할 문자가 없으면 기본 슬러그를 사용한다", () => {
  assert.equal(createPostSlug("---", "1234ABCD"), "post-1234abcd");
});

test("연구 글은 로그인한 작성자만 수정할 수 있다", () => {
  assert.equal(canEditResearchPost(null, 1), false);
  assert.equal(canEditResearchPost(1, 2), false);
  assert.equal(canEditResearchPost(1, 1), true);
  assert.equal(canEditResearchPost(null, null), false);
});
