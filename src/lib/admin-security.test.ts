import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_SESSION_MAX_AGE_MS,
  areAdminCredentialsValid,
  getAdminCredentialVersion,
  isValidAdminSession,
} from "@/lib/admin-credentials";
import {
  ACCOUNT_ATTEMPT_LIMIT,
  getLoginThrottleKey,
  isLoginAttemptAllowed,
  isLoginThrottleBlocked,
} from "@/lib/login-security";

test("admin credentials use an exact constant-time comparison", () => {
  assert.equal(
    areAdminCredentialsValid("admin", "correct", "admin", "correct"),
    true,
  );
  assert.equal(
    areAdminCredentialsValid("admin", "wrong", "admin", "correct"),
    false,
  );
});

test("admin sessions expire and invalidate when credentials change", () => {
  const now = Date.now();
  const currentVersion = getAdminCredentialVersion(
    "admin",
    "correct",
    "secret",
  );
  const user = {
    role: "ADMIN",
    adminCredentialVersion: currentVersion,
    adminExpiresAt: now + ADMIN_SESSION_MAX_AGE_MS,
  };

  assert.equal(isValidAdminSession(user, currentVersion, now), true);
  assert.equal(
    isValidAdminSession(
      user,
      getAdminCredentialVersion("admin", "changed", "secret"),
      now,
    ),
    false,
  );
  assert.equal(
    isValidAdminSession(user, currentVersion, user.adminExpiresAt),
    false,
  );
  assert.equal(
    isValidAdminSession({ ...user, role: "RESEARCHER" }, currentVersion, now),
    false,
  );
});

test("login throttle keys hide identifiers and enforce boundaries", () => {
  const accountKey = getLoginThrottleKey(
    "account",
    "admin@example.com",
    "secret",
  );
  const ipKey = getLoginThrottleKey("ip", "203.0.113.10", "secret");

  assert.notEqual(accountKey, ipKey);
  assert.equal(accountKey.includes("admin@example.com"), false);
  assert.equal(isLoginAttemptAllowed(ACCOUNT_ATTEMPT_LIMIT, ACCOUNT_ATTEMPT_LIMIT), true);
  assert.equal(
    isLoginAttemptAllowed(ACCOUNT_ATTEMPT_LIMIT + 1, ACCOUNT_ATTEMPT_LIMIT),
    false,
  );
  assert.equal(
    isLoginThrottleBlocked(new Date("2026-09-02T00:15:00Z"), new Date("2026-09-02T00:00:00Z")),
    true,
  );
  assert.equal(
    isLoginThrottleBlocked(new Date("2026-09-02T00:15:00Z"), new Date("2026-09-02T00:15:00Z")),
    false,
  );
});
