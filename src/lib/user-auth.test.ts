import assert from "node:assert/strict";
import test from "node:test";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import {
  canResearcherSignIn,
  getAuthNavigation,
  getPostLoginPath,
  isLoginPassword,
  isValidAuthTokenHash,
  parseNewPasswordInput,
  parseSignupInput,
} from "@/lib/user-auth";

function parsePassword(password: string) {
  return parseSignupInput({
    name: "연구자",
    email: "researcher@example.com",
    password,
    passwordConfirmation: password,
    privacyConsent: true,
  });
}

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
  const verified = {
    status: UserStatus.APPROVED,
    supabaseAuthId: "11111111-1111-1111-1111-111111111111",
    emailVerifiedAt: new Date(),
  };
  assert.equal(canResearcherSignIn(verified), true);
  assert.equal(
    canResearcherSignIn({ ...verified, status: UserStatus.PENDING }),
    false,
  );
  assert.equal(canResearcherSignIn({ ...verified, emailVerifiedAt: null }), false);
  assert.equal(canResearcherSignIn({ ...verified, supabaseAuthId: null }), false);
});

test("password length boundaries allow any character composition", () => {
  assert.equal(parsePassword("가".repeat(14)).ok, false);
  assert.equal(parsePassword("가".repeat(15)).ok, true);
  assert.equal(parsePassword(" ".repeat(128)).ok, true);
  assert.equal(parsePassword("!".repeat(129)).ok, false);
  assert.equal(isLoginPassword("x".repeat(128)), true);
  assert.equal(isLoginPassword("x".repeat(129)), false);
  assert.equal(isLoginPassword(128), false);
});

test("auth navigation matches each session role", () => {
  assert.deepEqual(getAuthNavigation(null), {
    label: "로그인",
    href: "/login",
  });
  assert.deepEqual(getAuthNavigation("RESEARCHER"), {
    label: "내 정보",
    href: "/account",
  });
  assert.deepEqual(getAuthNavigation("ADMIN"), {
    label: "관리자",
    href: "/admin",
  });
});

test("post-login destinations match each session role", () => {
  assert.equal(getPostLoginPath(null), "/login");
  assert.equal(getPostLoginPath("RESEARCHER"), "/");
  assert.equal(getPostLoginPath("ADMIN"), "/admin");
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

test("password reset validates password and token boundaries", () => {
  assert.equal(parseNewPasswordInput("x".repeat(15), "x".repeat(15)).ok, true);
  assert.equal(parseNewPasswordInput("x".repeat(14), "x".repeat(14)).ok, false);
  assert.equal(parseNewPasswordInput("x".repeat(15), "y".repeat(15)).ok, false);
  assert.equal(isValidAuthTokenHash("a".repeat(20)), true);
  assert.equal(isValidAuthTokenHash("a".repeat(19)), false);
  assert.equal(isValidAuthTokenHash(`a${"b".repeat(20)} c`), false);
});
