import assert from "node:assert/strict";
import test from "node:test";
import {
  AttachmentKind,
  PostStatus,
  PostType,
} from "@/generated/prisma/enums";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  claimResearchUploadForDiscard,
  saveResearchPostAtomically,
} from "@/lib/research-posts";

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
              const ids = where.id?.in ?? [];
              pending.committedAttachmentIds.push(...ids);
              return { count: ids.length };
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

type DiscardRow = {
  id: string;
  objectPath: string;
  authorId: number;
  type: PostType;
  status: PostStatus;
  postDeletedAt: Date | null;
  committedAt: Date | null;
  deletedAt: Date | null;
};

function createDiscardHarness(
  row: DiscardRow,
  commitBetweenReads = false,
) {
  let findWhere: unknown;
  let updateWhere: unknown;
  let updateData: unknown;
  const database = {
    $transaction: async (
      callback: (transaction: unknown) => Promise<unknown>,
    ) => {
      const pending = { ...row };
      const transaction = {
        postAttachment: {
          findFirst: async ({ where }: { where: { id: string; committedAt: null; post: { authorId: number; type: PostType; status: { not: PostStatus }; deletedAt: null } } }) => {
            findWhere = where;
            const matches =
              pending.id === where.id &&
              pending.authorId === where.post.authorId &&
              pending.type === where.post.type &&
              pending.status !== where.post.status.not &&
              pending.postDeletedAt === where.post.deletedAt &&
              pending.committedAt === where.committedAt;
            if (!matches) return null;
            const result = {
              id: pending.id,
              objectPath: pending.objectPath,
              deletedAt: pending.deletedAt,
            };
            if (commitBetweenReads) pending.committedAt = new Date();
            return result;
          },
          updateMany: async ({ where, data }: { where: { id: string; committedAt: null; deletedAt: Date | null }; data: { deletedAt: Date | null } }) => {
            updateWhere = where;
            updateData = data;
            const matches =
              pending.id === where.id &&
              pending.committedAt === where.committedAt &&
              pending.deletedAt?.getTime() === where.deletedAt?.getTime();
            if (!matches) return { count: 0 };
            pending.deletedAt = data.deletedAt;
            return { count: 1 };
          },
        },
      };
      const result = await callback(transaction);
      Object.assign(row, pending);
      return result;
    },
  } as unknown as Pick<PrismaClient, "$transaction">;

  return {
    database,
    row,
    getFindWhere: () => findWhere,
    getUpdateWhere: () => updateWhere,
    getUpdateData: () => updateData,
  };
}

function makeDiscardRow(overrides: Partial<DiscardRow> = {}): DiscardRow {
  return {
    id: "pending-file",
    objectPath: "research/12/4/pending-file.pdf",
    authorId: 12,
    type: PostType.RESEARCH,
    status: PostStatus.DRAFT,
    postDeletedAt: null,
    committedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

test("작성자는 활성 연구 글의 미확정 첨부만 Storage 정리를 요청할 수 있다", async () => {
  const harness = createDiscardHarness(makeDiscardRow());

  const path = await claimResearchUploadForDiscard(harness.database, {
    attachmentId: "pending-file",
    authorId: 12,
  });

  assert.equal(path, "research/12/4/pending-file.pdf");
  assert.ok(harness.row.deletedAt instanceof Date);
  assert.deepEqual(harness.getFindWhere(), {
    id: "pending-file",
    committedAt: null,
    post: {
      authorId: 12,
      type: PostType.RESEARCH,
      status: { not: PostStatus.ARCHIVED },
      deletedAt: null,
    },
  });
  assert.deepEqual(harness.getUpdateWhere(), {
    id: "pending-file",
    committedAt: null,
    deletedAt: null,
    post: {
      authorId: 12,
      type: PostType.RESEARCH,
      status: { not: PostStatus.ARCHIVED },
      deletedAt: null,
    },
  });
});

test("타인·비연구·보관·삭제 글과 확정 첨부는 정리 대상이 아니다", async () => {
  const disallowedRows = [
    makeDiscardRow({ authorId: 99 }),
    makeDiscardRow({ type: PostType.NOTICE }),
    makeDiscardRow({ status: PostStatus.ARCHIVED }),
    makeDiscardRow({ postDeletedAt: new Date() }),
    makeDiscardRow({ committedAt: new Date() }),
  ];

  for (const row of disallowedRows) {
    const harness = createDiscardHarness(row);
    const path = await claimResearchUploadForDiscard(harness.database, {
      attachmentId: row.id,
      authorId: 12,
    });
    assert.equal(path, null);
    assert.equal(harness.getUpdateWhere(), undefined);
  }
});

test("삭제 표시된 미확정 파일은 같은 경로로 재정리할 수 있다", async () => {
  const deletedAt = new Date("2026-10-22T00:00:00.000Z");
  const harness = createDiscardHarness(makeDiscardRow({ deletedAt }));

  const path = await claimResearchUploadForDiscard(harness.database, {
    attachmentId: "pending-file",
    authorId: 12,
  });

  assert.equal(path, "research/12/4/pending-file.pdf");
  assert.equal(harness.row.deletedAt, deletedAt);
  assert.deepEqual(harness.getUpdateData(), { deletedAt });
});

test("확정과 동시에 경합한 정리 요청은 Storage 경로를 받지 못한다", async () => {
  const harness = createDiscardHarness(makeDiscardRow(), true);

  const path = await claimResearchUploadForDiscard(harness.database, {
    attachmentId: "pending-file",
    authorId: 12,
  });

  assert.equal(path, null);
  assert.ok(harness.row.committedAt instanceof Date);
  assert.equal(harness.row.deletedAt, null);
});

test("Storage 정리가 실패해도 soft delete 표식과 원본 경로를 보존한다", async () => {
  const harness = createDiscardHarness(makeDiscardRow());
  await assert.rejects(
    async () => {
      const path = await claimResearchUploadForDiscard(harness.database, {
        attachmentId: "pending-file",
        authorId: 12,
      });
      if (path) throw new Error("Storage unavailable");
    },
    /Storage unavailable/,
  );
  assert.ok(harness.row.deletedAt instanceof Date);
  assert.equal(harness.row.objectPath, "research/12/4/pending-file.pdf");
});
