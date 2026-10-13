import assert from "node:assert/strict";
import test from "node:test";
import { completeAccountDeletion } from "@/lib/account-deletion-flow";

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
