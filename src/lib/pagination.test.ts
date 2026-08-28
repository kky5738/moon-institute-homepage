import assert from "node:assert/strict";
import test from "node:test";
import { getPostPageWindow, parsePageParam, POSTS_PER_PAGE } from "@/lib/pagination";

test("게시글 pagination이 첫·중간·마지막 범위를 겹치지 않게 계산한다", () => {
  const pages = [1, 2, 3].map((page) => getPostPageWindow(page, 25));

  assert.deepEqual(
    pages.map(({ page, offset, totalPages }) => ({ page, offset, totalPages })),
    [
      { page: 1, offset: 0, totalPages: 3 },
      { page: 2, offset: POSTS_PER_PAGE, totalPages: 3 },
      { page: 3, offset: POSTS_PER_PAGE * 2, totalPages: 3 },
    ],
  );
  assert.equal(getPostPageWindow(99, 25).page, 3);
  assert.equal(parsePageParam("0"), 1);
  assert.equal(parsePageParam("2"), 2);
  assert.equal(parsePageParam(["2", "3"]), 1);
});
