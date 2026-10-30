import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { parseInquiryForm } from "./inquiry-validation";

function form(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    type: "GENERAL", name: "이름", email: "test@example.com", phone: "",
    subject: "제목", message: "문의 내용을 입력합니다.", ...values,
  })) data.set(key, value);
  return data;
}

test("이메일 또는 전화번호와 전화번호 표기·길이를 검사한다", () => {
  for (const phone of ["1234567", "123456789012345", "010-1234-5678", "+82 10 1234 5678"]) {
    assert.equal(parseInquiryForm(form({ email: "", phone })).ok, true, phone);
    assert.equal(parseInquiryForm(form({ phone })).ok, true, phone);
  }
  assert.equal(parseInquiryForm(form()).ok, true);
  for (const phone of ["abc", "-", "123456", "1234567890123456", "+", "++1234567", "123+4567", "123--4567", "123  4567", "123(4567)", "１２３４５６７"]) {
    assert.equal(parseInquiryForm(form({ phone })).ok, false, phone);
  }
  assert.equal(parseInquiryForm(form({ email: "", phone: "" })).ok, false);
  assert.equal(parseInquiryForm(form({ email: "bad", phone: "1234567" })).ok, false);
  const result = parseInquiryForm(form({ phone: "  +82 10-1234-5678  " }));
  assert.equal(result.ok && result.data.phone, "+82 10-1234-5678");
});

test("기존 유형·이름·이메일·제목·본문 길이 검증을 유지한다", () => {
  for (const type of ["GENERAL", "PARTICIPATION", "DONATION_INTEREST"]) assert.equal(parseInquiryForm(form({ type })).ok, true);
  for (const values of [
    { type: "INVALID" }, { name: "a" }, { name: "a".repeat(81) },
    { email: "a".repeat(117) + "@b.co" }, { subject: "a".repeat(121) },
    { message: "a".repeat(9) }, { message: "a".repeat(2001) },
  ]) assert.equal(parseInquiryForm(form(values)).ok, false, JSON.stringify(values));
  assert.equal(parseInquiryForm(form({ name: "a".repeat(80), email: "a".repeat(115) + "@b.co", subject: "a".repeat(120), message: "a".repeat(2000) })).ok, true);
  assert.equal(parseInquiryForm(form({ name: "ab", message: "a".repeat(10) })).ok, true);
});

test("잘못된 연락처는 제한 저장소와 문의 DB에 접근하기 전에 거부한다", async () => {
  let attempts = 0;
  let writes = 0;
  const exports = {};
  const dependencies: Record<string, unknown> = {
    "next/cache": { revalidatePath() {} },
    "next/headers": { async headers() { return new Headers(); } },
    "@/lib/inquiry-validation": { parseInquiryForm },
    "@/lib/inquiry-throttle": { async consumeInquiryAttempt() { attempts++; return true; } },
    "@/lib/prisma": { prisma: { inquiry: { async create() { writes++; } } } },
    "@/lib/server-log": { logServerError() {} },
  };
  runInNewContext(ts.transpileModule(readFileSync("src/app/contact/actions.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require(name: string) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  const actions = exports as typeof import("@/app/contact/actions");
  const initial = { status: "idle" as const, message: "", submissionId: 0 };
  for (const phone of ["abc", "-", "123456", "1234567890123456"]) {
    const result = await actions.createInquiry(initial, form({ email: "", phone }));
    assert.equal(result.status, "error");
    assert.match(result.message, /연락처/);
  }
  assert.equal(attempts, 0);
  assert.equal(writes, 0);
  assert.equal((await actions.createInquiry(initial, form({ email: "", phone: "+82 10-1234-5678" }))).status, "success");
  assert.equal(attempts, 1);
  assert.equal(writes, 1);
});
