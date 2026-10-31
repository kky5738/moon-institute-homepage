import assert from "node:assert/strict";
import { test } from "node:test";
import { isBeforeHome } from "./home-navigation";

test("메뉴는 기존 홈이 내비게이션에 닿을 때 표시된다", () => {
  assert.equal(isBeforeHome(undefined, 64), true);
  assert.equal(isBeforeHome(65, 64), true);
  assert.equal(isBeforeHome(64, 64), false);
  assert.equal(isBeforeHome(-20, 64), false);
});
