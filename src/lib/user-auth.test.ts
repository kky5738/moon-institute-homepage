import assert from "node:assert/strict";
import test from "node:test";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { hashPassword, verifyPassword } from "@/lib/password";
import { canResearcherSignIn, parseSignupInput } from "@/lib/user-auth";

test("signup applies researcher and pending defaults", () => {
  const result = parseSignupInput({
    name: "  연구자  ",
    email: "  Researcher@Example.com  ",
    password: "safe-password-1234",
    passwordConfirmation: "safe-password-1234",
    privacyConsent: true,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.data.name, "연구자");
  assert.equal(result.data.email, "researcher@example.com");
  assert.equal(result.data.role, UserRole.RESEARCHER);
  assert.equal(result.data.status, UserStatus.PENDING);
});

test("only approved researchers can sign in", () => {
  assert.equal(canResearcherSignIn(UserStatus.PENDING), false);
  assert.equal(canResearcherSignIn(UserStatus.APPROVED), true);
  assert.equal(canResearcherSignIn(UserStatus.DISABLED), false);
});

test("password mismatch identifies only the confirmation field", () => {
  const result = parseSignupInput({
    name: "연구자",
    email: "researcher@example.com",
    password: "safe-password-1234",
    passwordConfirmation: "different-password-1234",
    privacyConsent: true,
  });

  assert.deepEqual(result, {
    ok: false,
    field: "passwordConfirmation",
    message: "비밀번호 확인이 일치하지 않습니다.",
  });
});

test("passwords use salted one-way hashes", async () => {
  const password = "safe-password-1234";
  const first = await hashPassword(password);
  const second = await hashPassword(password);

  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong-password-1234", first), false);
  assert.equal(await verifyPassword(password, "malformed"), false);
});
