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
import * as helpers from "../src/lib/admin-posts";

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

const initial = { status: "idle" as const, message: "" };
function form(id: number, extra: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ id: String(id), ...extra })) data.set(key, value);
  return data;
}

test("READY-35 관리자 삭제: 격리 PostgreSQL과 Storage 대역", { timeout: 180_000 }, async (t) => {
  const container = `ready35-${randomUUID()}`;
  const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  let db: PrismaClient | undefined;
  try {
    docker("run", "--detach", "--rm", "--name", container, "-e", "POSTGRES_PASSWORD=test", "-e", "POSTGRES_DB=ready35_test", "-p", "127.0.0.1::5432", "postgres:17.11-alpine");
    for (let attempt = 0; ; attempt++) {
      try { docker("exec", container, "pg_isready", "-U", "postgres"); break; }
      catch (error) { if (attempt >= 60) throw error; await new Promise((resolve) => setTimeout(resolve, 250)); }
    }
    const port = docker("port", container, "5432/tcp").split(":").at(-1);
    const url = `postgresql://postgres:test@127.0.0.1:${port}/ready35_test`;
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: "pipe" });
    const prisma = db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    let session: { user: { role: string; adminSessionValid: boolean } } | null = { user: { role: "ADMIN", adminSessionValid: true } };
    let storageFails = false;
    const paths: string[][] = [];
    const logs: Array<{ context: string; details?: Record<string, unknown> }> = [];
    const auth = load<typeof import("../src/lib/admin-auth")>("src/lib/admin-auth.ts", {
      "../../auth": { auth: async () => session },
      "next/navigation": { unstable_rethrow() {}, redirect() {} },
      "@/lib/server-log": { logServerError() {} },
    });
    const deps = {
      "next/cache": { revalidatePath() {}, updateTag() {} },
      "next/navigation": { unstable_rethrow() {}, redirect() { throw new Error("redirect"); } },
      "@/generated/prisma/enums": enums, "@/lib/admin-auth": auth, "@/lib/admin-posts": helpers,
      "@/lib/prisma": { prisma }, "@/lib/posts": { getPublishedPostsCacheTag: () => "posts" },
      "@/lib/server-log": { logServerError(context: string, _error: unknown, details?: Record<string, unknown>) { logs.push({ context, details }); } },
      "@/lib/supabase-storage": { async removeResearchObjects(items: string[]) { paths.push(items); if (storageFails) throw new Error("storage unavailable"); } },
    };
    const actions = load<typeof import("../src/app/admin/posts/actions")>("src/app/admin/posts/actions.ts", deps);
    const category = await prisma.category.create({ data: { name: "Notice", slug: "notice-test", postType: enums.PostType.NOTICE } });
    const makePost = (type: enums.PostType = enums.PostType.NOTICE, status: enums.PostStatus = enums.PostStatus.ARCHIVED) => prisma.post.create({ data: { title: "test", slug: randomUUID(), content: "body", type, status, categoryId: category.id } });
    const redirect = (promise: Promise<unknown>) => assert.rejects(promise, /redirect/);

    await t.test("권한·활성 글·연구 글 차단 및 공지/홍보 삭제", async () => {
      const archived = await makePost();
      session = null;
      assert.equal((await actions.deletePost(initial, form(archived.id))).status, "auth");
      session = { user: { role: "RESEARCHER", adminSessionValid: false } };
      assert.equal((await actions.deletePost(initial, form(archived.id))).status, "auth");
      session = { user: { role: "ADMIN", adminSessionValid: true } };
      for (const post of [await makePost(enums.PostType.NOTICE, enums.PostStatus.PUBLISHED), await makePost(enums.PostType.RESEARCH)]) {
        assert.equal((await actions.deletePost(initial, form(post.id))).status, "validation");
        assert.equal((await prisma.post.findUniqueOrThrow({ where: { id: post.id } })).deletedAt, null);
      }
      for (const post of [archived, await makePost(enums.PostType.PROMOTION)]) {
        await redirect(actions.deletePost(initial, form(post.id)));
        assert.ok((await prisma.post.findUniqueOrThrow({ where: { id: post.id } })).deletedAt);
        await redirect(actions.deletePost(initial, form(post.id)));
        assert.equal((await actions.updatePost(initial, form(post.id, { title: "x", slug: randomUUID(), content: "x", categoryId: String(category.id), intent: "publish" }))).status, "validation");
        await assert.rejects(actions.archivePost(form(post.id)));
        assert.equal(await prisma.post.count({ where: helpers.getAdminEditablePostWhere(post.id) }), 0);
      }
    });

    await t.test("첨부 원본 정리 실패는 숨김·경로를 보존하고 재시도한다", async () => {
      const post = await makePost();
      const attachment = await prisma.postAttachment.create({ data: { postId: post.id, kind: enums.AttachmentKind.ATTACHMENT, originalName: "a.pdf", objectPath: `test/${randomUUID()}`, contentType: "application/pdf", size: 10 } });
      storageFails = true;
      assert.equal((await actions.deletePost(initial, form(post.id))).status, "error");
      assert.ok((await prisma.post.findUniqueOrThrow({ where: { id: post.id } })).deletedAt);
      const marked = await prisma.postAttachment.findUniqueOrThrow({ where: { id: attachment.id } });
      assert.ok(marked.deletedAt);
      assert.equal(marked.objectPath, attachment.objectPath);
      assert.ok(logs.some((log) => log.context === "admin.posts.delete" && JSON.stringify(log.details).includes(attachment.id)));
      storageFails = false;
      await redirect(actions.deletePost(initial, form(post.id)));
      assert.ok(paths.some((items) => items.includes(attachment.objectPath)));
    });

    await t.test("DB 실패 시 삭제 표식이 롤백된다", async () => {
      const post = await makePost();
      const wrapped = { $transaction: (callback: (tx: unknown) => Promise<unknown>) => prisma.$transaction(async (tx) => callback({ ...tx, post: tx.post, postAttachment: { ...tx.postAttachment, updateMany: async () => { throw new Error("injected DB failure"); } } })) };
      const failing = load<typeof import("../src/app/admin/posts/actions")>("src/app/admin/posts/actions.ts", { ...deps, "@/lib/prisma": { prisma: wrapped } });
      assert.equal((await failing.deletePost(initial, form(post.id))).status, "error");
      assert.equal((await prisma.post.findUniqueOrThrow({ where: { id: post.id } })).deletedAt, null);
    });

    await t.test("삭제·재공개 경합은 삭제된 글을 되살리지 않는다", async () => {
      for (let i = 0; i < 5; i++) {
        const post = await makePost();
        const update = form(post.id, { title: "changed", slug: randomUUID(), content: "changed", categoryId: String(category.id), intent: "publish" });
        await Promise.allSettled([actions.deletePost(initial, form(post.id)), actions.updatePost(initial, update)]);
        const saved = await prisma.post.findUniqueOrThrow({ where: { id: post.id } });
        if (saved.deletedAt) assert.equal(saved.status, enums.PostStatus.ARCHIVED);
      }
    });
  } finally {
    await db?.$disconnect();
    try { docker("rm", "--force", container); } catch {}
  }
});
