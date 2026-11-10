import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import * as validation from "../src/lib/home-introduction-validation";
import * as pagination from "../src/lib/pagination";
import { inspectHomeIntroductionImage } from "../src/lib/home-introduction-image";

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

test("첫 화면 업로드의 인증·실제 디코딩·실패 정리·재시도·동시 완료를 격리 PostgreSQL에서 검증한다", { timeout: 180_000 }, async () => {
  const container = `ready60-${randomUUID()}`;
  const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  let db: PrismaClient | undefined;
  try {
    docker("run", "--detach", "--rm", "--name", container, "-e", "POSTGRES_PASSWORD=test", "-e", "POSTGRES_DB=ready60_test", "-p", "127.0.0.1::5432", "postgres:17.11-alpine");
    for (let attempt = 0; ; attempt++) {
      try { docker("exec", container, "pg_isready", "-U", "postgres"); break; }
      catch (error) { if (attempt >= 60) throw error; await new Promise((resolve) => setTimeout(resolve, 250)); }
    }
    const port = docker("port", container, "5432/tcp").split(":").at(-1);
    const url = `postgresql://postgres:test@127.0.0.1:${port}/ready60_test`;
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: "pipe" });
    const prisma = db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    const initial = await prisma.homeIntroductionContent.findUniqueOrThrow({ where: { id: validation.DEFAULT_HOME_INTRODUCTION_ID } });
    assert.equal(initial.message, "문선명 선생 그는...");
    assert.equal(initial.size, readFileSync("src/assets/home-introduction.jpeg").length);
    const local = await sharp(readFileSync("src/assets/home-introduction.jpeg")).metadata();
    assert.equal(initial.imageWidth, local.width);
    assert.equal(initial.imageHeight, local.height);
    assert.equal((await prisma.homeIntroductionSettings.findUniqueOrThrow({ where: { id: "home-introduction" } })).currentContentId, initial.id);
    await assert.rejects(prisma.homeIntroductionSettings.create({ data: { id: "second", currentContentId: initial.id } }));

    await assert.rejects(prisma.homeIntroductionContent.create({ data: {
      id: randomUUID(), objectPath: null, localAsset: null, contentType: "image/jpeg", size: 1,
      imageWidth: 1, imageHeight: 1, message: "문구", altText: "설명",
    } }));

    let role = "ADMIN";
    const auth = load<typeof import("../src/lib/admin-auth")>("src/lib/admin-auth.ts", {
      "../../auth": { auth: async () => role === "anonymous" ? null : { user: { id: "admin", role: role === "expired" ? "ADMIN" : role, adminSessionValid: role !== "expired" } } },
      "next/navigation": { unstable_rethrow() {}, redirect() { throw new Error("redirect"); } },
      "@/lib/server-log": { logServerError() {} },
    });
    const objects = new Map<string, Uint8Array>();
    const removed: string[] = [];
    let failTicket = false;
    let failRemove = false;
    let failSave = false;
    const service = load<typeof import("../src/lib/home-introduction-uploads")>("src/lib/home-introduction-uploads.ts", {
      "server-only": {}, "node:crypto": { randomUUID },
      "@/lib/prisma": { prisma: { homeIntroductionUpload: prisma.homeIntroductionUpload,
        $transaction: (work: (tx: unknown) => unknown, options: object) => prisma.$transaction(async (tx) => {
          if (!failSave) return work(tx);
          return work({ ...tx, homeIntroductionContent: { findUnique: tx.homeIntroductionContent.findUnique.bind(tx.homeIntroductionContent), create() { throw new Error("DB write failed"); } } });
        }, options),
      } },
      "@/lib/home-introduction-validation": validation,
      "@/lib/home-introduction-image": { inspectHomeIntroductionImage },
      "@/lib/server-log": { logServerError() {} },
      "@/lib/supabase-storage": {
        async createResearchUploadTicket(path: string) { if (failTicket) throw new Error("ticket failure"); return { bucket: "test", path, token: "test", supabaseUrl: "test", publishableKey: "test" }; },
        async downloadHomeIntroductionImage(path: string, expected: { size: number }) {
          const bytes = objects.get(path);
          if (!bytes || bytes.length !== expected.size) throw new Error("upload missing or wrong size");
          return bytes;
        },
        async removeResearchObjects(paths: string[]) { if (failRemove) throw new Error("remove failed"); for (const path of paths) { removed.push(path); objects.delete(path); } },
      },
    });
    let failApply = false;
    let failCache = false;
    let holdId: string | null = null;
    let held: () => void = () => {};
    let release: () => void = () => {};
    let hold = Promise.resolve();
    const domain = load<typeof import("../src/lib/home-introduction")>("src/lib/home-introduction.ts", {
      "server-only": {}, "@/lib/home-introduction-validation": validation, "@/lib/pagination": pagination,
      "@/lib/prisma": { prisma: {
        $transaction: (work: (tx: unknown) => unknown, options: object) => prisma.$transaction(async (tx) => work({
          ...tx, homeIntroductionContent: {
            ...tx.homeIntroductionContent,
            async update(args: Parameters<typeof tx.homeIntroductionContent.update>[0]) {
              if (failApply) throw new Error("DB apply failure");
              const result = await tx.homeIntroductionContent.update(args);
              if (args.where.id === holdId) { held(); await hold; }
              return result;
            },
          },
        }), options),
      } },
    });
    const actions = load<typeof import("../src/app/admin/home-introduction/actions")>("src/app/admin/home-introduction/actions.ts", {
      "@/lib/admin-auth": auth, "@/lib/home-introduction-uploads": service, "@/lib/server-log": { logServerError() {} },
      "@/lib/home-introduction": domain, "next/cache": { updateTag() { if (failCache) throw new Error("cache failure"); }, revalidatePath() {} },
    });
    const bytes = await sharp({ create: { width: 40, height: 20, channels: 3, background: "white" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const input = { contentType: "image/jpeg", size: bytes.length, message: "한 문장입니다.", altText: "테스트 이미지" };
    for (const denied of ["anonymous", "RESEARCHER", "expired"]) {
      role = denied;
      await assert.rejects(actions.requestHomeIntroductionUpload(input), /Unauthorized/);
      await assert.rejects(actions.confirmHomeIntroductionUpload(randomUUID()), /Unauthorized/);
      await assert.rejects(actions.cancelHomeIntroductionUpload(randomUUID()), /Unauthorized/);
      await assert.rejects(actions.applyHomeIntroduction(randomUUID()), /Unauthorized/);
      await assert.rejects(actions.refreshHomeIntroductionCache(), /Unauthorized/);
    }
    role = "ADMIN";
    const request = async () => {
      const result = await actions.requestHomeIntroductionUpload(input);
      if (!result.ok) assert.fail(result.message);
      assert.match(result.path, /^home-introduction\/[0-9a-f-]+\.jpg$/);
      return result;
    };
    const missing = await request();
    await assert.rejects(prisma.homeIntroductionSettings.update({ where: { id: "home-introduction" }, data: { currentContentId: missing.id } }));
    assert.equal((await actions.confirmHomeIntroductionUpload(missing.id)).ok, false);
    assert.equal(await prisma.homeIntroductionUpload.count(), 0);
    assert.equal((await actions.confirmHomeIntroductionUpload(randomUUID())).ok, false);

    const wrongOwner = await request();
    await assert.rejects(service.completeHomeIntroductionUpload("other-admin", wrongOwner.id));
    assert.ok(await prisma.homeIntroductionUpload.findUnique({ where: { id: wrongOwner.id } }));
    await service.discardHomeIntroductionUpload("admin", wrongOwner.id);

    const forged = await request();
    objects.set(forged.path, new Uint8Array(bytes.length).fill(65));
    assert.equal((await actions.confirmHomeIntroductionUpload(forged.id)).ok, false);
    assert.ok(removed.includes(forged.path));
    assert.equal(await prisma.homeIntroductionContent.count(), 1);

    failTicket = true;
    assert.equal((await actions.requestHomeIntroductionUpload(input)).ok, false);
    failTicket = false;
    assert.equal(await prisma.homeIntroductionUpload.count(), 0);

    const failure = await request(); objects.set(failure.path, bytes);
    failSave = true;
    assert.equal((await actions.confirmHomeIntroductionUpload(failure.id)).ok, false);
    failSave = false;
    assert.ok(removed.includes(failure.path));
    assert.equal(await prisma.homeIntroductionUpload.count(), 0);

    const cleanup = await request();
    failRemove = true;
    assert.equal((await actions.confirmHomeIntroductionUpload(cleanup.id)).ok, false);
    assert.ok(await prisma.homeIntroductionUpload.findUnique({ where: { id: cleanup.id } }));
    failRemove = false;
    assert.equal((await actions.cancelHomeIntroductionUpload(cleanup.id)).ok, true);

    const retry = await request(); objects.set(retry.path, bytes);
    const results = await Promise.all([actions.confirmHomeIntroductionUpload(retry.id), actions.confirmHomeIntroductionUpload(retry.id)]);
    assert.ok(results.every((result) => result.ok));
    const saved = await prisma.homeIntroductionContent.findUniqueOrThrow({ where: { id: retry.id } });
    assert.equal(saved.imageWidth, 20); assert.equal(saved.imageHeight, 40);
    assert.equal(saved.message, input.message);
    assert.equal(saved.lastAppliedAt, null);
    assert.equal(await prisma.homeIntroductionContent.count(), 2);
    assert.equal(await prisma.homeIntroductionUpload.count(), 0);
    await actions.cancelHomeIntroductionUpload(retry.id);
    assert.ok(objects.has(retry.path));
    assert.ok(!removed.includes(retry.path));
    assert.equal((await prisma.homeIntroductionSettings.findUniqueOrThrow({ where: { id: "home-introduction" } })).currentContentId, initial.id);

    const race = await request(); objects.set(race.path, bytes);
    await Promise.all([actions.confirmHomeIntroductionUpload(race.id), actions.cancelHomeIntroductionUpload(race.id)]);
    const kept = await prisma.homeIntroductionContent.findUnique({ where: { id: race.id } });
    assert.equal(objects.has(race.path), !!kept);
    assert.equal(await prisma.homeIntroductionUpload.count(), 0);

    const current = async () => (await prisma.homeIntroductionSettings.findUniqueOrThrow({ where: { id: "home-introduction" } })).currentContentId;
    const applied = async (id: string) => (await prisma.homeIntroductionContent.findUniqueOrThrow({ where: { id } })).lastAppliedAt;
    assert.equal((await actions.applyHomeIntroduction(retry.id)).status, "success");
    assert.equal(await current(), retry.id);
    const firstTime = await applied(retry.id);
    assert.ok(firstTime);
    assert.equal((await actions.applyHomeIntroduction(retry.id)).status, "success");
    assert.deepEqual(await applied(retry.id), firstTime);
    for (const invalid of [randomUUID(), "invalid", "../../research/1"]) {
      assert.equal((await actions.applyHomeIntroduction(invalid)).status, "save-error");
      assert.equal(await current(), retry.id);
    }
    const pending = await request();
    assert.equal((await actions.applyHomeIntroduction(pending.id)).status, "save-error");
    await actions.cancelHomeIntroductionUpload(pending.id);
    const second = await request(); objects.set(second.path, bytes);
    assert.equal((await actions.confirmHomeIntroductionUpload(second.id)).ok, true);
    failApply = true;
    assert.equal((await actions.applyHomeIntroduction(second.id)).status, "save-error");
    assert.equal(await current(), retry.id);
    assert.equal(await applied(second.id), null);
    failApply = false;
    assert.equal((await actions.applyHomeIntroduction(second.id)).status, "success");
    assert.equal(await current(), second.id);
    assert.ok(objects.has(retry.path)); assert.ok(objects.has(second.path));
    const preserved = await prisma.homeIntroductionContent.findUniqueOrThrow({ where: { id: retry.id } });
    assert.deepEqual({ ...preserved, lastAppliedAt: null }, saved);
    assert.equal((await actions.applyHomeIntroduction(initial.id)).status, "success");
    assert.equal(await current(), initial.id);

    holdId = retry.id;
    hold = new Promise<void>((resolve) => { release = resolve; });
    const entered = new Promise<void>((resolve) => { held = resolve; });
    const firstApply = actions.applyHomeIntroduction(retry.id);
    await entered;
    let secondFinished = false;
    const secondApply = actions.applyHomeIntroduction(second.id).then((result) => { secondFinished = true; return result; });
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      assert.equal(secondFinished, false);
      assert.equal(await current(), initial.id);
    } finally { release(); }
    const concurrent = await Promise.all([firstApply, secondApply]);
    assert.ok(concurrent.every((result) => result.status === "success"));
    assert.equal(await current(), second.id);
    holdId = null;
    failCache = true;
    assert.equal((await actions.applyHomeIntroduction(initial.id)).status, "cache-error");
    assert.equal(await current(), initial.id);
    failCache = false;
    await actions.applyHomeIntroduction(second.id);
    const secondTime = await applied(second.id);
    assert.equal((await actions.refreshHomeIntroductionCache()).status, "success");
    assert.equal(await current(), second.id);
    assert.deepEqual(await applied(second.id), secondTime);

    const originals = await prisma.homeIntroductionContent.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
    await prisma.homeIntroductionContent.createMany({ data: Array.from({ length: 12 }, (_, index) => {
      const id = randomUUID();
      return { id, objectPath: `home-introduction/${id}.jpg`, ...input, imageWidth: 20, imageHeight: 40, createdAt: new Date(Date.now() + index * 1000) };
    }) });
    const firstPage = await domain.getHomeIntroductionPage(1);
    const lastPage = await domain.getHomeIntroductionPage(999);
    assert.equal(firstPage.contents.length, 10);
    assert.equal(lastPage.page, lastPage.totalPages);
    assert.equal(firstPage.totalItems, originals.length + 12);
    assert.equal(firstPage.currentContentId, second.id);
    const ids = [...firstPage.contents, ...lastPage.contents].map((row) => row.id);
    assert.equal(new Set(ids).size, firstPage.totalItems);
    assert.ok(firstPage.contents.every((row) => !("objectPath" in row)));
    assert.equal((await domain.getHomeIntroductionPage(0)).page, 1);
    assert.equal(await prisma.homeIntroductionUpload.count(), 0);

    const rls = await prisma.$queryRaw<Array<{ relrowsecurity: boolean }>>`SELECT relrowsecurity FROM pg_class WHERE relname IN ('home_introduction_contents', 'home_introduction_settings', 'home_introduction_uploads')`;
    assert.equal(rls.length, 3); assert.ok(rls.every((row) => row.relrowsecurity));
  } finally {
    await db?.$disconnect();
    try { docker("rm", "--force", container); } catch { /* Container startup may fail. */ }
  }
});
