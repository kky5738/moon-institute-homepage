import assert from "node:assert/strict";
import test from "node:test";
import { PostType } from "@/generated/prisma/enums";
import {
  getAdminEditableCategoryWhere,
  getAdminEditableCategoriesWhere,
  getAdminEditablePostWhere,
} from "@/lib/admin-posts";

test("관리자 게시글 수정은 공지와 홍보자료 유형으로 제한한다", () => {
  assert.deepEqual(getAdminEditablePostWhere(42), {
    id: 42,
    type: { in: [PostType.NOTICE, PostType.PROMOTION] },
  });
});

test("관리자 수정 카테고리는 활성 공지 또는 홍보자료로 제한한다", () => {
  assert.deepEqual(getAdminEditableCategoriesWhere(), {
    isActive: true,
    postType: { in: [PostType.NOTICE, PostType.PROMOTION] },
  });
  assert.deepEqual(getAdminEditableCategoryWhere(7), {
    id: 7,
    isActive: true,
    postType: { in: [PostType.NOTICE, PostType.PROMOTION] },
  });
});
