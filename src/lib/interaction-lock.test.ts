import assert from "node:assert/strict";
import test from "node:test";
import { acquireLock } from "@/lib/interaction-lock";

test("동시에 하나의 폼 작업만 잠금을 획득한다", () => {
  const lock = { current: false };

  assert.equal(acquireLock(lock), true);
  assert.equal(acquireLock(lock), false);

  lock.current = false;
  assert.equal(acquireLock(lock), true);
});
