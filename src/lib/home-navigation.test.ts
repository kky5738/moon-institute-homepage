import assert from "node:assert/strict";
import { test } from "node:test";
import { isBeforeHome, isOnManifesto } from "./home-navigation";

test("메뉴는 기존 홈이 내비게이션에 닿을 때 표시된다", () => {
  assert.equal(isBeforeHome(undefined, 64), true);
  assert.equal(isBeforeHome(65, 64), true);
  assert.equal(isBeforeHome(64, 64), false);
  assert.equal(isBeforeHome(-20, 64), false);
});

test("선언문 구간에서만 로고 배경을 표시한다", () => {
  assert.equal(isOnManifesto(undefined, 800, 64), false);
  assert.equal(isOnManifesto(65, 800, 64), false);
  assert.equal(isOnManifesto(64, 800, 64), true);
  assert.equal(isOnManifesto(-1000, 64, 64), false);
});
