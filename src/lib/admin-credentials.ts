import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_MAX_AGE_MS = 60 * 60 * 1000;

export function areAdminCredentialsValid(
  username: string,
  password: string,
  expectedUsername: string,
  expectedPassword: string,
) {
  const usernameMatches = safeEqual(username, expectedUsername);
  const passwordMatches = safeEqual(password, expectedPassword);

  return usernameMatches && passwordMatches;
}

export function isAdminUsername(username: string, expectedUsername: string) {
  return safeEqual(username, expectedUsername);
}

export function getAdminCredentialVersion(
  username: string,
  password: string,
  secret: string,
) {
  return createHmac("sha256", secret)
    .update("admin-session\0")
    .update(username)
    .update("\0")
    .update(password)
    .digest("base64url");
}

export function getCurrentAdminCredentialVersion() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!username || !password || !secret) return null;

  return getAdminCredentialVersion(username, password, secret);
}

export function isValidAdminSession(
  user:
    | {
        role?: string;
        adminCredentialVersion?: string;
        adminExpiresAt?: number;
      }
    | null
    | undefined,
  currentVersion: string | null,
  now = Date.now(),
) {
  return Boolean(
    user?.role === "ADMIN" &&
      typeof user.adminCredentialVersion === "string" &&
      typeof user.adminExpiresAt === "number" &&
      Number.isFinite(user.adminExpiresAt) &&
      user.adminExpiresAt > now &&
      currentVersion &&
      safeEqual(user.adminCredentialVersion, currentVersion),
  );
}

function safeEqual(first: string, second: string) {
  const firstDigest = createHash("sha256").update(first).digest();
  const secondDigest = createHash("sha256").update(second).digest();

  return timingSafeEqual(firstDigest, secondDigest);
}
