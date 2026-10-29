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
import { inquiryRetentionCutoff } from "../src/lib/inquiry-retention";

function load<T>(path: string, dependencies: Record<string, unknown>): T {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, console: { error() {} }, require(name: string) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports as T;
}

function form(id: string, status?: string) {
  const data = new FormData();
  data.set("id", id);
  if (status) data.set("status", status);
  return data;
}

test("문의 완료·보존·삭제를 격리 PostgreSQL에서 검증한다", { timeout: 180_000 }, async () => {
  const container = `ready37-${randomUUID()}`;
  const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  let db: PrismaClient | undefined;
  try {
    docker("run", "--detach", "--rm", "--name", container, "-e", "POSTGRES_PASSWORD=test", "-e", "POSTGRES_DB=ready37_test", "-p", "127.0.0.1::5432", "postgres:17.11-alpine");
    for (let attempt = 0; ; attempt++) {
      try { docker("exec", container, "pg_isready", "-U", "postgres"); break; }
      catch (error) { if (attempt >= 60) throw error; await new Promise((resolve) => setTimeout(resolve, 250)); }
    }
    const port = docker("port", container, "5432/tcp").split(":").at(-1);
    const url = `postgresql://postgres:test@127.0.0.1:${port}/ready37_test`;
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: "pipe" });
    const prisma = db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    let session: { user: { role: string; adminSessionValid: boolean } } | null = { user: { role: "ADMIN", adminSessionValid: true } };
    const auth = load<typeof import("../src/lib/admin-auth")>("src/lib/admin-auth.ts", {
      "../../auth": { auth: async () => session },
      "next/navigation": { unstable_rethrow() {}, redirect() { throw new Error("redirect"); } },
      "@/lib/server-log": { logServerError() {} },
    });
    let failDelete = false;
    const actions = load<typeof import("../src/app/admin/inquiries/actions")>("src/app/admin/inquiries/actions.ts", {
      "next/cache": { revalidatePath() {} },
      "next/navigation": { unstable_rethrow() {}, redirect() { throw new Error("redirect"); } },
      "@/generated/prisma/enums": enums, "@/lib/admin-auth": auth,
      "@/lib/prisma": { prisma: { inquiry: {
        update: prisma.inquiry.update.bind(prisma.inquiry),
        updateMany: prisma.inquiry.updateMany.bind(prisma.inquiry),
        findUnique: prisma.inquiry.findUnique.bind(prisma.inquiry),
        deleteMany: async (...args: Parameters<typeof prisma.inquiry.deleteMany>) => {
          if (failDelete) throw new Error("database unavailable");
          return prisma.inquiry.deleteMany(...args);
        },
      } } },
      "@/lib/server-log": { logServerError() {} },
    });
    const inquiry = await prisma.inquiry.create({ data: { name: "test", message: "private message" } });
    const id = String(inquiry.id);
    assert.equal(inquiry.completedAt, null);
    const cutoff = inquiryRetentionCutoff(new Date("2026-10-30T00:00:00Z"));
    const expired = await prisma.inquiry.create({ data: { name: "expired", message: "test", completedAt: cutoff } });
    await prisma.inquiry.create({ data: { name: "not expired", message: "test", completedAt: new Date(cutoff.getTime() + 1) } });
    const due = await prisma.inquiry.findMany({ where: { completedAt: { lte: cutoff } }, select: { id: true } });
    assert.deepEqual(due.map((item) => item.id), [expired.id]);
    for (const value of [null, { user: { role: "RESEARCHER", adminSessionValid: true } }, { user: { role: "ADMIN", adminSessionValid: false } }]) {
      session = value;
      await assert.rejects(auth.requireAdmin());
      await assert.rejects(actions.updateInquiryStatus(form(id, "REVIEWED")));
      await assert.rejects(actions.completeInquiry(form(id)));
      assert.match((await actions.deleteInquiry({ message: "" }, form(id))).message, /인증/);
    }
    session = { user: { role: "ADMIN", adminSessionValid: true } };
    await actions.updateInquiryStatus(form(id, "REVIEWED"));
    assert.equal((await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } })).completedAt, null);
    await actions.completeInquiry(form(id));
    const completedAt = (await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } })).completedAt!;
    for (const status of ["ARCHIVED", "NEW", "REVIEWED"]) await actions.updateInquiryStatus(form(id, status));
    await actions.completeInquiry(form(id));
    assert.equal((await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } })).completedAt!.getTime(), completedAt.getTime());
    assert.match((await actions.deleteInquiry({ message: "" }, form("bad"))).message, /유효한/);
    assert.match((await actions.deleteInquiry({ message: "" }, form("2147483647"))).message, /존재하지/);
    failDelete = true;
    assert.match((await actions.deleteInquiry({ message: "" }, form(id))).message, /삭제하지 못/);
    assert.ok(await prisma.inquiry.findUnique({ where: { id: inquiry.id } }));
    failDelete = false;
    await assert.rejects(actions.deleteInquiry({ message: "" }, form(id)), /redirect/);
    assert.equal(await prisma.inquiry.findUnique({ where: { id: inquiry.id } }), null);
    assert.match((await actions.deleteInquiry({ message: "" }, form(id))).message, /존재하지/);
    await assert.rejects(actions.completeInquiry(form(id)), /존재하지/);
  } finally {
    await db?.$disconnect();
    try { docker("rm", "-f", container); } catch {}
  }
});
