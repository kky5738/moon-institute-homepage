import assert from "node:assert/strict";
import test from "node:test";
import { AttachmentKind, PostStatus, PostType } from "@/generated/prisma/enums";
import type { PrismaClient } from "@/generated/prisma/client";
import { saveResearchPostAtomically } from "@/lib/research-posts";

type State = {
  status: PostStatus;
  title: string;
  summary: string | null;
  content: string;
  publishedAt: Date | null;
  deletedAttachmentIds: string[];
  committedAttachmentIds: string[];
};

type Attachment = { id: string; kind: AttachmentKind };

function createSaveHarness(status: PostStatus, attachments: Attachment[] = []) {
  const state: State = {
    status,
    title: "기존 제목",
    summary: "기존 요약",
    content: "기존 본문",
    publishedAt: null,
    deletedAttachmentIds: [],
    committedAttachmentIds: [],
  };
  let postWhere: unknown;
  let attachmentWhere: unknown;
  const database = {
    $transaction: async (
      callback: (transaction: unknown) => Promise<void>,
    ) => {
      const pending: State = {
        ...state,
        deletedAttachmentIds: [...state.deletedAttachmentIds],
        committedAttachmentIds: [...state.committedAttachmentIds],
      };
      const transaction = {
        postAttachment: {
          findMany: async ({ where }: { where: { id: { in: string[] } } }) => {
            attachmentWhere = where;
            return attachments.filter((attachment) =>
              where.id.in.includes(attachment.id),
            );
          },
          updateMany: async ({
            where,
          }: {
            where: {
              id?: { in?: string[] };
              OR?: { id?: { in?: string[] } }[];
            };
          }) => {
            if ("committedAt" in where) {
              pending.committedAttachmentIds.push(...where.id.in);
              return { count: where.id.in.length };
            }
            const ids = where.OR?.flatMap((condition) => condition.id?.in ?? []) ?? [];
            pending.deletedAttachmentIds.push(...ids);
            return { count: ids.length };
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

  return {
    database,
    state,
    getPostWhere: () => postWhere,
    getAttachmentWhere: () => attachmentWhere,
  };
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
    attachmentIds: [],
    removedIds: ["removed-file"],
  };
}

test("보관 후 작성자 저장이 충돌하면 본문과 첨부 변경을 모두 롤백한다", async () => {
  const { database, state, getPostWhere } = createSaveHarness(
    PostStatus.ARCHIVED,
    [{ id: "new-file", kind: AttachmentKind.ATTACHMENT }],
  );
  const input = { ...makeInput(), attachmentIds: ["new-file"] };

  await assert.rejects(
    saveResearchPostAtomically(database, input),
    /게시글이 보관되었거나 수정할 수 없는 상태입니다/,
  );

  assert.deepEqual(state, {
    status: PostStatus.ARCHIVED,
    title: "기존 제목",
    summary: "기존 요약",
    content: "기존 본문",
    publishedAt: null,
    deletedAttachmentIds: [],
    committedAttachmentIds: [],
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
    committedAttachmentIds: [],
    summary: null,
    publishedAt: new Date("2026-10-21T00:00:00.000Z"),
  });
});

test("이번 저장 요청에 포함된 업로드만 확정한다", async () => {
  const { database, state, getAttachmentWhere } = createSaveHarness(PostStatus.DRAFT, [
    { id: "selected-file", kind: AttachmentKind.ATTACHMENT },
    { id: "unselected-file", kind: AttachmentKind.ATTACHMENT },
  ]);

  await saveResearchPostAtomically(database, {
    ...makeInput(),
    attachmentIds: ["selected-file"],
    removedIds: [],
  });

  assert.deepEqual(state.committedAttachmentIds, ["selected-file"]);
  assert.deepEqual(state.deletedAttachmentIds, []);
  assert.deepEqual(getAttachmentWhere(), {
    id: { in: ["selected-file"] },
    postId: 4,
    uploadedAt: { not: null },
    deletedAt: null,
    post: { authorId: 12, type: PostType.RESEARCH, deletedAt: null },
  });
});

test("요청 ID에 해당하는 업로드 행이 없으면 본문과 첨부를 바꾸지 않는다", async () => {
  const { database, state } = createSaveHarness(PostStatus.DRAFT);

  await assert.rejects(
    saveResearchPostAtomically(database, {
      ...makeInput(),
      attachmentIds: ["missing-file"],
      removedIds: [],
    }),
    /저장할 첨부 또는 본문 이미지가 유효하지 않습니다/,
  );

  assert.deepEqual(state.committedAttachmentIds, []);
  assert.deepEqual(state.deletedAttachmentIds, []);
  assert.equal(state.content, "기존 본문");
});
