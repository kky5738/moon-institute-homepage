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
import * as validation from "../src/lib/life-record-validation";
import * as imageValidation from "../src/lib/home-introduction-validation";
import * as pagination from "../src/lib/pagination";
import { createHomeIntroductionDisplay } from "../src/lib/home-introduction-image";

function load<T>(path: string, deps: Record<string, unknown>): T {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, Response, Uint8Array, Date, require(name: string) {
    if (!(name in deps)) throw new Error(`Unexpected dependency: ${name}`);
    return deps[name];
  } });
  return exports as T;
}

test("격리 DB에서 초안·사진 소유·공개·보관·동시 편집과 페이지 이동을 검증한다", { timeout: 180_000 }, async () => {
  const container = `life-record-test-${randomUUID()}`;
  const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  let db: PrismaClient | undefined;
  try {
    docker("run", "--detach", "--rm", "--name", container, "-e", "POSTGRES_PASSWORD=test", "-e", "POSTGRES_DB=life_test", "-p", "127.0.0.1::5432", "postgres:17.11-alpine");
    for (let attempt = 0; ; attempt++) {
      try { docker("exec", container, "pg_isready", "-U", "postgres"); break; }
      catch (error) { if (attempt >= 60) throw error; await new Promise(resolve => setTimeout(resolve, 250)); }
    }
    const port = docker("port", container, "5432/tcp").split(":").at(-1);
    const url = `postgresql://postgres:test@127.0.0.1:${port}/life_test`;
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: "pipe" });
    const prisma = db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    const protectedTables = await prisma.$queryRaw<Array<{ relname: string; relrowsecurity: boolean }>>`
      SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('life_records', 'life_record_images')`;
    assert.equal(protectedTables.length, 2);
    assert.ok(protectedTables.every(table => table.relrowsecurity));
    const initial = await prisma.lifeRecord.findMany({ orderBy: { sortOrder: "asc" } });
    assert.equal(initial.length, 3);
    assert.deepEqual(initial.map(r => r.title), ["탄생", "결혼(성혼)", "사망(성화)"]);
    assert.ok(initial.every(r => r.status === "DRAFT" && r.year === null && !r.content));

    const common = { "server-only": {}, "@/lib/prisma": { prisma }, "@/lib/life-record-validation": validation,
      "@/lib/server-log": { logServerError() {}, isPrismaMissingTableError: () => false } };
    const service = load<typeof import("../src/lib/life-records")>("src/lib/life-records.ts", {
      ...common, "next/cache": { cacheLife() {}, cacheTag() {} }, "@/lib/pagination": pagination,
    });
    const objects = new Map<string, Uint8Array>();
    let brokenUpload = false;
    const images = load<typeof import("../src/lib/life-record-images")>("src/lib/life-record-images.ts", {
      ...common, "node:crypto": { randomUUID }, "@/lib/home-introduction-validation": imageValidation,
      "@/lib/home-introduction-image": { createHomeIntroductionDisplay },
      "@/lib/supabase-storage": {
        async createResearchUploadTicket(path: string) { return { path }; },
        async downloadHomeIntroductionImage(path: string, expected: { size: number }) { const bytes = objects.get(path); if (!bytes || bytes.length !== expected.size) throw new Error("bad size"); return bytes; },
        async uploadHomeIntroductionDisplay(path: string, bytes: Uint8Array) { objects.set(path, bytes); if (brokenUpload) throw new Error("upload failure"); },
        async removeResearchObjects(paths: string[]) { paths.forEach(path => objects.delete(path)); },
        async downloadHomeIntroductionDisplay(path: string) { const bytes = objects.get(path); if (!bytes) throw new Error("missing"); return bytes; },
      },
    });
    const original = await sharp({ create: { width: 80, height: 60, channels: 3, background: "#4c3a7a" } }).png().toBuffer();
    const upload = async (recordId: string) => {
      const ticket = await images.prepareLifeImage("test-admin", { recordId, name: "test.png", size: original.length, contentType: "image/png" });
      objects.set(ticket.path, original);
      return ticket;
    };
    const ticket = await upload(initial[0].id);
    assert.equal((await images.lifeImageResponse(ticket.id)).status, 404);
    assert.equal((await images.lifeImageResponse(ticket.id, true)).status, 404);
    await Promise.all([images.completeLifeImage("test-admin", ticket.id), images.completeLifeImage("test-admin", ticket.id)]);
    assert.equal((await images.lifeImageResponse(ticket.id, true)).status, 200);
    assert.equal((await images.lifeImageResponse(ticket.id)).status, 404);
    await images.discardLifeImage("test-admin", ticket.id);
    assert.ok(await prisma.lifeRecordImage.findUnique({ where: { id: ticket.id } }));

    const fields: validation.LifeRecordFields = { title: "검증용 사건", year: 1920, dateLabel: "", summary: "검증용 요약", content: "검증용 본문", source: "검증용 출처", coverImageId: ticket.id, imageAlt: "검증 사진", featured: true, sortOrder: 1, status: "PUBLISHED" };
    await assert.rejects(service.saveLifeRecord(fields, { id: initial[1].id, updatedAt: initial[1].updatedAt.toISOString() }), /이 사건/);
    assert.equal(await service.getPublishedLifeRecord(initial[0].slug), null);
    const published = await service.saveLifeRecord(fields, { id: initial[0].id, updatedAt: initial[0].updatedAt.toISOString() });
    assert.equal((await service.getLifeHighlights()).length, 1);
    assert.equal((await service.getPublishedLifeRecord(published.slug))?.content, fields.content);
    assert.equal((await images.lifeImageResponse(ticket.id)).status, 200);
    const publicImage = await images.lifeImageResponse(ticket.id);
    assert.equal(publicImage.headers.get("Cache-Control"), "private, no-store");

    await assert.rejects(service.saveLifeRecord({ ...fields, title: "덮어쓰기" }, { id: published.id, updatedAt: initial[0].updatedAt.toISOString() }), /다른 화면/);
    const hiddenCard = await service.saveLifeRecord({ ...fields, featured: false }, { id: published.id, updatedAt: published.updatedAt.toISOString() });
    assert.equal((await service.getLifeHighlights()).length, 0);
    assert.ok(await service.getPublishedLifeRecord(published.slug));
    await service.saveLifeRecord({ ...fields, status: "ARCHIVED" }, { id: published.id, updatedAt: hiddenCard.updatedAt.toISOString() });
    assert.equal(await service.getPublishedLifeRecord(published.slug), null);
    assert.equal((await images.lifeImageResponse(ticket.id)).status, 404);
    assert.equal((await images.lifeImageResponse(ticket.id, true)).status, 200);

    brokenUpload = true;
    const failed = await upload(initial[1].id);
    await assert.rejects(images.completeLifeImage("test-admin", failed.id));
    assert.equal(await prisma.lifeRecordImage.findUnique({ where: { id: failed.id } }), null);
    assert.ok(!objects.has(failed.path));
    brokenUpload = false;
    const corrupt = await upload(initial[1].id);
    objects.set(corrupt.path, new Uint8Array(original.length));
    await assert.rejects(images.completeLifeImage("test-admin", corrupt.id));
    assert.equal(await prisma.lifeRecordImage.findUnique({ where: { id: corrupt.id } }), null);

    await prisma.lifeRecord.createMany({ data: Array.from({ length: 1000 }, (_,i) => ({
      id: randomUUID(), slug: `test-${i}`, title: `검증 ${i}`, year: 1900 + i, summary: "검증용", content: "검증용", status: "PUBLISHED" as const,
    })) });
    const result = await service.getLifeRecordPage(2, { q: "검증", year: null });
    assert.equal(result.totalItems, 1000); assert.equal(result.records.length, 10); assert.equal(result.records[0].year, 1910);
    assert.equal((await service.getLifeRecordPage(1, { q: "검증", year: 1950 })).totalItems, 1);
  } finally {
    await db?.$disconnect();
    try { docker("rm", "--force", container); } catch { /* No container if startup failed. */ }
  }
});
