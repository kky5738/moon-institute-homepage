import assert from "node:assert/strict";
import test from "node:test";
import { inquiryRetentionCutoff } from "./inquiry-retention";

test("완료 후 1년 경계와 윤일의 기준 시각", () => {
  assert.equal(inquiryRetentionCutoff(new Date("2025-03-01T12:00:00Z")).toISOString(), "2024-03-01T12:00:00.000Z");
  assert.equal(inquiryRetentionCutoff(new Date("2024-02-29T12:00:00Z")).toISOString(), "2023-02-28T12:00:00.000Z");
  assert.equal(inquiryRetentionCutoff(new Date("2025-02-28T12:00:00Z")).toISOString(), "2024-02-28T12:00:00.000Z");
});
