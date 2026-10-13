import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@/generated/prisma/client";
import { completeAccountDeletion, deleteDraftPostsWithFiles } from "@/lib/account-deletion-flow";

test("auth deletion failure preserves the database record for retry", async () => {
  let deleted = false;
  await assert.rejects(
    completeAccountDeletion(
      async () => ({ error: { status: 503 } }),
      async () => { deleted = true; },
    ),
  );
  assert.equal(deleted, false);
});

test("database failure can be retried after the auth user is already gone", async () => {
  let attempts = 0;
  const deleteDatabaseUser = async () => {
    if (++attempts === 1) throw new Error("database unavailable");
  };

  await assert.rejects(
    completeAccountDeletion(async () => ({ error: null }), deleteDatabaseUser),
    /database unavailable/,
  );
  await completeAccountDeletion(
    async () => ({ error: { status: 404, code: "user_not_found" } }),
    deleteDatabaseUser,
  );
  assert.equal(attempts, 2);
});

test("an unrelated 404 does not delete database records", async () => {
  let deleted = false;
  await assert.rejects(
    completeAccountDeletion(
      async () => ({ error: { status: 404, code: "route_not_found" } }),
      async () => { deleted = true; },
    ),
  );
  assert.equal(deleted, false);
});

test("draft files are removed before records; partial storage failure keeps paths for retry", async () => {
  const paths = ["draft/document.pdf", "draft/removed.png", "draft/unconfirmed.png"];
  const storedFiles = new Set([...paths, "published/document.pdf"]);
  let recordsDeleted = false;
  const transaction = {
    $queryRaw: async (sql: TemplateStringsArray, userId: number) => {
      assert.equal(userId, 7);
      assert.match(sql.join("?"), /"authorId" = \? AND status = 'DRAFT'/);
      assert.match(sql.join("?"), /FOR UPDATE/);
      return [{ id: 10 }];
    },
    postAttachment: {
      findMany: async (args: unknown) => {
        assert.deepEqual(args, {
          where: { postId: { in: [10] } },
          select: { objectPath: true },
        });
        return paths.map((objectPath) => ({ objectPath }));
      },
    },
    post: {
      deleteMany: async (args: unknown) => {
        assert.deepEqual(args, { where: { id: { in: [10] } } });
        assert.ok(paths.every((path) => !storedFiles.has(path)));
        recordsDeleted = true;
      },
    },
  } as unknown as Prisma.TransactionClient;

  await assert.rejects(
    deleteDraftPostsWithFiles(transaction, 7, async (requestedPaths) => {
      assert.deepEqual(requestedPaths, paths);
      storedFiles.delete(requestedPaths[0]);
      throw new Error("storage unavailable");
    }),
    /storage unavailable/,
  );
  assert.equal(recordsDeleted, false);

  await deleteDraftPostsWithFiles(transaction, 7, async (requestedPaths) => {
    assert.deepEqual(requestedPaths, paths);
    requestedPaths.forEach((path) => storedFiles.delete(path));
  });
  assert.equal(recordsDeleted, true);
  assert.deepEqual([...storedFiles], ["published/document.pdf"]);
});

test("no drafts skips storage and draft record deletion", async () => {
  const transaction = {
    $queryRaw: async () => [],
  } as unknown as Prisma.TransactionClient;
  await deleteDraftPostsWithFiles(transaction, 7, async () => {
    assert.fail("storage must not be called without drafts");
  });
});
