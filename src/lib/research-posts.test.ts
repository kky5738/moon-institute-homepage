import assert from "node:assert/strict";
import test from "node:test";
import { PostStatus, PostType } from "@/generated/prisma/enums";
import type { PrismaClient } from "@/generated/prisma/client";
import { saveResearchPostAtomically } from "@/lib/research-posts";

type State = {
  status: PostStatus;
  title: string;
  summary: string | null;
  content: string;
  publishedAt: Date | null;
  deletedAttachmentIds: string[];
};

function createSaveHarness(status: PostStatus) {
  const state: State = {
    status,
    title: "기존 제목",
    summary: "기존 요약",
    content: "기존 본문",
    publishedAt: null,
    deletedAttachmentIds: [],
  };
  let postWhere: unknown;
  const database = {
    $transaction: async (
      callback: (transaction: unknown) => Promise<void>,
    ) => {
      const pending: State = {
        ...state,
        deletedAttachmentIds: [...state.deletedAttachmentIds],
      };
      const transaction = {
        postAttachment: {
          updateMany: async () => {
            pending.deletedAttachmentIds.push("removed-file");
            return { count: 1 };
          },
        },
        post: {
          updateMany: async ({ where, data }: { where: unknown; data: Partial<State> }) => {
            postWhere = where;
            if (pending.status === PostStatus.ARCHIVED) return { count: 0 };
            Object.assign(pending, data);
            return { count: 1 };
          },
        },
      };

      await callback(transaction);
      Object.assign(state, pending);
    },
  } as unknown as Pick<PrismaClient, "$transaction">;

  return { database, state, getPostWhere: () => postWhere };
}

function makeInput() {
  return {
    postId: 4,
    authorId: 12,
    title: "새 제목",
    summary: null,
    content: "새 본문",
    status: PostStatus.PUBLISHED,
    publishedAt: new Date("2026-10-21T00:00:00.000Z"),
    imageIds: [],
    removedIds: ["removed-file"],
  };
}

test("보관 후 작성자 저장이 충돌하면 본문과 첨부 변경을 모두 롤백한다", async () => {
  const { database, state, getPostWhere } = createSaveHarness(PostStatus.ARCHIVED);

  await assert.rejects(
    saveResearchPostAtomically(database, makeInput()),
    /게시글이 보관되었거나 수정할 수 없는 상태입니다/,
  );

  assert.deepEqual(state, {
    status: PostStatus.ARCHIVED,
    title: "기존 제목",
    summary: "기존 요약",
    content: "기존 본문",
    publishedAt: null,
    deletedAttachmentIds: [],
  });
  assert.deepEqual(getPostWhere(), {
    id: 4,
    authorId: 12,
    type: PostType.RESEARCH,
    status: { not: PostStatus.ARCHIVED },
    deletedAt: null,
  });
});

test("작성자 저장 후 관리자가 보관하면 글은 보관 상태를 유지한다", async () => {
  const { database, state } = createSaveHarness(PostStatus.PUBLISHED);

  await saveResearchPostAtomically(database, makeInput());
  state.status = PostStatus.ARCHIVED;

  assert.deepEqual(state, {
    status: PostStatus.ARCHIVED,
    title: "새 제목",
    content: "새 본문",
    deletedAttachmentIds: ["removed-file"],
    summary: null,
    publishedAt: new Date("2026-10-21T00:00:00.000Z"),
  });
});
