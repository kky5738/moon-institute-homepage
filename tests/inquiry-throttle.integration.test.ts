import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import * as enums from "../src/generated/prisma/enums";
import * as crypto from "node:crypto";
import * as net from "node:net";

function load<T>(path: string, dependencies: Record<string, unknown>, env: Record<string, string>) {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, Date, URL, process: { env }, console, require(name: string) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports as T;
}

test("문의 제한은 DB에서 직접·동시 요청, 만료 및 장애를 처리한다", { timeout: 180_000 }, async () => {
  const container = `ready39-${randomUUID()}`;
  const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  let db: PrismaClient | undefined;
  try {
    docker("run", "--detach", "--rm", "--name", container, "-e", "POSTGRES_PASSWORD=test", "-e", "POSTGRES_DB=ready39_test", "-p", "127.0.0.1::5432", "postgres:17.11-alpine");
    for (let attempt = 0; ; attempt++) {
      try { docker("exec", container, "pg_isready", "-U", "postgres"); break; }
      catch (error) { if (attempt >= 60) throw error; await new Promise((resolve) => setTimeout(resolve, 250)); }
    }
    const port = docker("port", container, "5432/tcp").split(":").at(-1);
    const url = `postgresql://postgres:test@127.0.0.1:${port}/ready39_test`;
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: "pipe" });
    const prisma = db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    const env: Record<string, string> = { AUTH_SECRET: "isolated-test-secret", VERCEL: "1" };
    const throttle = load<typeof import("../src/lib/inquiry-throttle")>("src/lib/inquiry-throttle.ts", {
      "node:crypto": crypto, "node:net": net, "@/lib/prisma": { prisma },
    }, env);
    const request = (ip: string) => new Headers({ "x-vercel-forwarded-for": ip });
    const now = new Date("2026-10-30T00:00:00Z");
    await prisma.loginThrottle.create({ data: { keyHash: "existing-login-key", windowStartedAt: new Date("2026-10-01T00:00:00Z"), updatedAt: new Date("2026-10-01T00:00:00Z") } });
    const first = request("192.0.2.10");
    for (let i = 0; i < 5; i++) assert.equal(await throttle.consumeInquiryAttempt(first, now), true);
    assert.equal(await throttle.consumeInquiryAttempt(first, new Date(now.getTime() + 899999)), false);
    assert.equal(await throttle.consumeInquiryAttempt(first, new Date(now.getTime() + 900000)), true);
    const concurrent = await Promise.all(Array.from({ length: 20 }, () => throttle.consumeInquiryAttempt(request("192.0.2.11"), now)));
    assert.equal(concurrent.filter(Boolean).length, 5);
    const entries = await prisma.loginThrottle.findMany();
    assert.ok(entries.some((entry) => entry.keyHash === "existing-login-key"));
    assert.ok(entries.filter((entry) => entry.keyHash.startsWith("inquiry:")).every((entry) => !entry.keyHash.includes("192.0.2.")));
    env.VERCEL = "0";
    for (let i = 0; i < 5; i++) assert.equal(await throttle.consumeInquiryAttempt(request(`192.0.2.${20 + i}`), now), true);
    assert.equal(await throttle.consumeInquiryAttempt(request("192.0.2.99"), now), false);

    let fail = false;
    let requests = new Headers();
    env.VERCEL = "1";
    let currentTime = now;
    const actions = load<typeof import("../src/app/contact/actions")>("src/app/contact/actions.ts", {
      "next/cache": { revalidatePath() {} },
      "next/headers": { headers: async () => requests },
      "@/generated/prisma/enums": enums,
      "@/lib/prisma": { prisma },
      "@/lib/server-log": { logServerError() {} },
      "@/lib/inquiry-throttle": { consumeInquiryAttempt: (h: Headers) => {
        if (fail) throw new Error("store unavailable");
        return throttle.consumeInquiryAttempt(h, currentTime);
      } },
    }, env);
    const form = () => {
      const data = new FormData();
      for (const [key, value] of Object.entries({ type: "GENERAL", name: "test", email: "test@example.com", subject: "test", message: "test message content" })) data.set(key, value);
      return data;
    };
    const initial = { status: "idle" as const, message: "", submissionId: 0 };
    requests = request("192.0.2.12");
    const results = await Promise.all(Array.from({ length: 12 }, () => actions.createInquiry(initial, form())));
    assert.equal(results.filter((result) => result.status === "success").length, 5);
    assert.equal(await prisma.inquiry.count(), 5);
    assert.ok(results.filter((result) => result.status === "error").every((result) => result.message.includes("15분")));
    fail = true;
    const failure = await actions.createInquiry(initial, form());
    assert.equal(failure.status, "error");
    assert.match(failure.message, /일시적으로/);
    assert.equal(await prisma.inquiry.count(), 5);
    fail = false;
    delete env.AUTH_SECRET;
    assert.equal((await actions.createInquiry(initial, form())).status, "error");
    assert.equal(await prisma.inquiry.count(), 5);
    env.AUTH_SECRET = "isolated-test-secret";
    currentTime = new Date(now.getTime() + 900000);
    assert.equal((await actions.createInquiry(initial, form())).status, "success");
    assert.equal(await prisma.inquiry.count(), 6);
  } finally {
    await db?.$disconnect();
    try { docker("rm", "-f", container); } catch {}
  }
});
