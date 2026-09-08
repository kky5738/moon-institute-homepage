import assert from "node:assert/strict";
import test from "node:test";
import { measureLoginStage, withLoginTiming } from "./login-timing";

test("login timings are opt-in, isolated and never log results or errors", async () => {
  const previous = process.env.LOGIN_TIMING;
  const originalLog = console.info;
  const logs: unknown[][] = [];
  console.info = (...args: unknown[]) => { logs.push(args); };
  try {
    delete process.env.LOGIN_TIMING;
    assert.equal(await withLoginTiming(() => measureLoginStage("supabase", async () => "private-token")), "private-token");
    assert.equal(logs.length, 0);

    process.env.LOGIN_TIMING = "1";
    const failure = new Error("private-password");
    await Promise.all([
      withLoginTiming(() => measureLoginStage("supabase", async () => "private-token")),
      assert.rejects(withLoginTiming(() => measureLoginStage("member.lookup", async () => { throw failure; })), (error) => error === failure),
    ]);
    assert.equal(logs.length, 2);
    const entries = logs.map(([, entry]) => entry as { requestId: string; stages: Record<string, number>; totalMs: number });
    assert.notEqual(entries[0].requestId, entries[1].requestId);
    assert.deepEqual(entries.map(entry => Object.keys(entry.stages).join()).sort(), ["member.lookup", "supabase"]);
    for (const entry of entries) {
      assert.deepEqual(Object.keys(entry).sort(), ["requestId", "stages", "totalMs"]);
      assert.ok(entry.totalMs >= 0);
      assert.ok(Object.values(entry.stages).every(ms => Number.isFinite(ms) && ms >= 0));
    }
    assert.doesNotMatch(JSON.stringify(logs), /private|password|token/);
  } finally {
    console.info = originalLog;
    if (previous === undefined) delete process.env.LOGIN_TIMING;
    else process.env.LOGIN_TIMING = previous;
  }
});
