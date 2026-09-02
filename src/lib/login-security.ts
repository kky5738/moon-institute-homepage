import { createHmac } from "node:crypto";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;
export const ACCOUNT_ATTEMPT_LIMIT = 5;
export const IP_ATTEMPT_LIMIT = 20;

export function getLoginThrottleKey(
  scope: "account" | "ip",
  value: string,
  secret: string,
) {
  return createHmac("sha256", secret)
    .update(scope)
    .update("\0")
    .update(value)
    .digest("base64url");
}

export function isLoginThrottleBlocked(
  blockedUntil: Date | null,
  now = new Date(),
) {
  return Boolean(blockedUntil && blockedUntil > now);
}

export function isLoginAttemptAllowed(attemptCount: number, limit: number) {
  return attemptCount <= limit;
}
