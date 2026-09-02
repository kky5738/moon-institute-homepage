import type { Prisma } from "@/generated/prisma/client";
import {
  ACCOUNT_ATTEMPT_LIMIT,
  IP_ATTEMPT_LIMIT,
  isLoginAttemptAllowed,
  isLoginThrottleBlocked,
  getLoginThrottleKey,
  LOGIN_LOCK_MS,
  LOGIN_WINDOW_MS,
} from "@/lib/login-security";
import { prisma } from "@/lib/prisma";

const RETENTION_MS = 24 * 60 * 60 * 1000;

export async function consumeLoginAttempt(
  username: string,
  request: Request,
  now = new Date(),
) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for login throttling.");

  const accountKey = getLoginThrottleKey("account", normalizeUsername(username), secret);
  const clientIp = getClientIp(request);
  const ipKey = clientIp
    ? getLoginThrottleKey("ip", clientIp, secret)
    : null;

  return prisma.$transaction(async (transaction) => {
    await transaction.loginThrottle.deleteMany({
      where: { updatedAt: { lt: new Date(now.getTime() - RETENTION_MS) } },
    });

    const accountAllowed = await consumeThrottle(
      transaction,
      accountKey,
      ACCOUNT_ATTEMPT_LIMIT,
      now,
    );

    if (!accountAllowed || !ipKey) return accountAllowed;

    return consumeThrottle(transaction, ipKey, IP_ATTEMPT_LIMIT, now);
  });
}

export async function clearLoginAccountThrottle(username: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for login throttling.");

  await prisma.loginThrottle.deleteMany({
    where: {
      keyHash: getLoginThrottleKey(
        "account",
        normalizeUsername(username),
        secret,
      ),
    },
  });
}

async function consumeThrottle(
  transaction: Prisma.TransactionClient,
  keyHash: string,
  limit: number,
  now: Date,
) {
  const windowStart = new Date(now.getTime() - LOGIN_WINDOW_MS);

  await transaction.loginThrottle.updateMany({
    where: {
      keyHash,
      windowStartedAt: { lte: windowStart },
      OR: [{ blockedUntil: null }, { blockedUntil: { lte: now } }],
    },
    data: {
      attemptCount: 0,
      windowStartedAt: now,
      blockedUntil: null,
      updatedAt: now,
    },
  });

  const existing = await transaction.loginThrottle.findUnique({
    where: { keyHash },
  });

  if (isLoginThrottleBlocked(existing?.blockedUntil ?? null, now)) {
    return false;
  }

  const throttle = await transaction.loginThrottle.upsert({
    where: { keyHash },
    update: {
      attemptCount: { increment: 1 },
      updatedAt: now,
    },
    create: {
      keyHash,
      attemptCount: 1,
      windowStartedAt: now,
      updatedAt: now,
    },
  });

  if (isLoginAttemptAllowed(throttle.attemptCount, limit)) return true;

  await transaction.loginThrottle.update({
    where: { keyHash },
    data: {
      blockedUntil: new Date(now.getTime() + LOGIN_LOCK_MS),
      updatedAt: now,
    },
  });

  return false;
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase().slice(0, 320);
}

function getClientIp(request: Request) {
  const forwardedFor =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for");

  return forwardedFor?.split(",", 1)[0]?.trim().slice(0, 64) || null;
}
