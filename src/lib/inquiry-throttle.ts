import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 5;
const RETENTION_MS = 24 * 60 * 60 * 1000;

export async function consumeInquiryAttempt(requestHeaders: Headers, now = new Date()) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for inquiry throttling.");

  // Only Vercel's trusted proxy header is accepted; other deployments share one fallback bucket.
  const forwarded = process.env.VERCEL === "1" ? requestHeaders.get("x-vercel-forwarded-for")?.trim() : null;
  const address = forwarded && isIP(forwarded)
    ? isIP(forwarded) === 6 ? new URL(`http://[${forwarded}]`).hostname : forwarded
    : "unknown";
  const key = "inquiry:" + createHmac("sha256", secret).update(address).digest("base64url");
  const cutoff = new Date(now.getTime() - WINDOW_MS);

  await prisma.loginThrottle.deleteMany({
    where: { keyHash: { startsWith: "inquiry:" }, updatedAt: { lt: new Date(now.getTime() - RETENTION_MS) } },
  });

  const count = await prisma.$executeRaw`
    INSERT INTO "login_throttles" ("keyHash", "attemptCount", "windowStartedAt", "updatedAt")
    VALUES (${key}, 1, ${now}, ${now})
    ON CONFLICT ("keyHash") DO UPDATE SET
      "attemptCount" = CASE WHEN "login_throttles"."windowStartedAt" <= ${cutoff}
        THEN 1 ELSE "login_throttles"."attemptCount" + 1 END,
      "windowStartedAt" = CASE WHEN "login_throttles"."windowStartedAt" <= ${cutoff}
        THEN ${now} ELSE "login_throttles"."windowStartedAt" END,
      "updatedAt" = ${now}
    WHERE "login_throttles"."windowStartedAt" <= ${cutoff}
      OR "login_throttles"."attemptCount" < ${LIMIT}
  `;
  return count === 1;
}
