import assert from "node:assert/strict";
import test from "node:test";
import { buttonVariants } from "./button";
import { isPendingSubmitter } from "./pending-button";

test("only the submitted named button shows its pending label", () => {
  const data = new FormData();
  data.set("intent", "draft");

  assert.equal(
    isPendingSubmitter({ data, name: "intent", pending: true, value: "draft" }),
    true,
  );
  assert.equal(
    isPendingSubmitter({ data, name: "intent", pending: true, value: "publish" }),
    false,
  );
  assert.equal(
    isPendingSubmitter({ data: null, name: undefined, pending: true, value: undefined }),
    true,
  );
});

test("common buttons keep color feedback without a keyboard press scale", () => {
  const classes = buttonVariants();

  assert.match(classes, /active:bg-primary-dark/);
  assert.doesNotMatch(classes, /active:scale/);
});
