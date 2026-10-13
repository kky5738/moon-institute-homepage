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
import * as flow from "../src/lib/account-deletion-flow";

// Match the existing action tests: execute real modules, replace only external services.
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

// Always provision our own disposable DB; never read DATABASE_URL or touch an existing DB.
test("account deletion against isolated PostgreSQL", { timeout: 120_000 }, async (t) => {
  const container = `moon-deletion-test-${randomUUID()}`;
  const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8" }).trim();
  let db: PrismaClient | undefined;
  try {
    docker("run", "--detach", "--rm", "--name", container, "-e", "POSTGRES_PASSWORD=test",
      "-e", "POSTGRES_DB=deletion_test", "-p", "127.0.0.1::5432", "postgres:16-alpine");
    for (let attempt = 0; ; attempt++) {
      try { docker("exec", container, "pg_isready", "-U", "postgres"); break; }
      catch (error) {
        if (attempt >= 60) throw error;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    const port = docker("port", container, "5432/tcp").split(":").at(-1);
    const url = `postgresql://postgres:test@127.0.0.1:${port}/deletion_test`;
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: "pipe",
    });
    const prisma = db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    const authUsers = new Set<string>();
    const objects = new Set<string>();
    let authCalls = 0;
    let storageFailure = false;
    let authFailure = false;
    let session: unknown = { user: { role: "ADMIN", adminSessionValid: true } };
    let onAuth: (() => Promise<void>) | undefined;
    const finish = load<typeof import("../src/lib/account-deletion")>("src/lib/account-deletion.ts", {
      "@/generated/prisma/enums": enums, "@/lib/account-deletion-flow": flow,
      "@/lib/prisma": { prisma },
      "@/lib/supabase-auth": { getSupabaseAuthAdminClient: () => ({ auth: { admin: {
        async deleteUser(id: string) {
          authCalls++;
          await onAuth?.();
          if (authFailure) return { error: { status: 500, code: "unexpected_failure" } };
          return { error: authUsers.delete(id) ? null : { status: 404, code: "user_not_found" } };
        },
      } } }) },
      "@/lib/supabase-storage": { async removeResearchObjects(paths: string[]) {
        for (const path of paths) {
          objects.delete(path);
          if (storageFailure) throw new Error("storage failure");
        }
      } },
    });
    const admin = load<typeof import("../src/lib/admin-auth")>("src/lib/admin-auth.ts", {
      "../../auth": { auth: async () => session },
      "next/navigation": { unstable_rethrow() {} }, "@/lib/server-log": { logServerError() {} },
    });
    const actions = load<typeof import("../src/app/admin/users/actions")>("src/app/admin/users/actions.ts", {
      "next/cache": { revalidatePath() {}, updateTag() {} }, "@/generated/prisma/enums": enums,
      "@/lib/admin-auth": admin, "@/lib/account-deletion": finish,
      "@/lib/posts": { getPublishedPostsCacheTag: () => "research" },
      "@/lib/prisma": { prisma }, "@/lib/server-log": { logServerError() {} },
    });
    const retry = (id: number) => {
      const form = new FormData(); form.set("id", String(id));
      return actions.retryAccountDeletion(form);
    };
    async function fixture(status: enums.UserStatus = "DELETION_PENDING") {
      const uid = randomUUID();
      const user = await prisma.user.create({ data: {
        name: "test", email: `${uid}@example.invalid`, supabaseAuthId: uid, status,
      } });
      authUsers.add(uid);
      const posts = [];
      for (const status of ["DRAFT", "PUBLISHED", "ARCHIVED"] as const) {
        const path = `${uid}/${status}`; objects.add(path);
        posts.push(await prisma.post.create({ data: {
          title: status, slug: `${uid}-${status}`, content: "preserve", type: "RESEARCH", status,
          authorId: user.id, attachments: { create: {
            objectPath: path, originalName: "file.pdf", contentType: "application/pdf", size: 1,
            kind: "ATTACHMENT",
          } },
        }, include: { attachments: true } }));
      }
      return { user, posts };
    }
    await t.test("Auth success → real DB failure rolls back → retry preserves public posts and attachments", async () => {
      const { user, posts } = await fixture();
      await prisma.$executeRawUnsafe(`CREATE FUNCTION fail_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected DB failure'; END $$`);
      await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_delete BEFORE DELETE ON users FOR EACH ROW EXECUTE FUNCTION fail_delete()`);
      try { await assert.rejects(retry(user.id), /injected DB failure/); }
      finally { await prisma.$executeRawUnsafe(`DROP TRIGGER fail_delete ON users`); }
      assert.equal(authUsers.has(user.supabaseAuthId!), false);
      assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).status, "DELETION_PENDING");
      assert.equal(await prisma.post.count({ where: { authorId: user.id } }), 3);
      assert.equal(await prisma.postAttachment.count({ where: { postId: posts[0].id } }), 1);
      await retry(user.id);
      assert.equal(await prisma.user.findUnique({ where: { id: user.id } }), null);
      assert.equal(await prisma.post.findUnique({ where: { id: posts[0].id } }), null);
      assert.equal(await prisma.postAttachment.count({ where: { postId: posts[0].id } }), 0);
      for (const post of posts.slice(1)) {
        const kept = await prisma.post.findUniqueOrThrow({ where: { id: post.id }, include: { attachments: true } });
        assert.equal(kept.authorId, null); assert.equal(kept.content, "preserve");
        assert.equal(kept.attachments.length, 1); assert.ok(objects.has(post.attachments[0].objectPath));
      }
      const calls = authCalls; await retry(user.id); assert.equal(authCalls, calls);
    });
    await t.test("Storage failure retains draft paths and pending status for retry", async () => {
      const { user, posts } = await fixture(); storageFailure = true;
      try { await assert.rejects(retry(user.id), /storage failure/); }
      finally { storageFailure = false; }
      assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).status, "DELETION_PENDING");
      assert.equal(await prisma.postAttachment.count({ where: { postId: posts[0].id } }), 1);
      await retry(user.id);
    });
    await t.test("self deletion and two admin retries overlap and all succeed", async () => {
      const { user } = await fixture(); const calls = authCalls;
      let release!: () => void; let entered!: () => void;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      const started = new Promise<void>((resolve) => { entered = resolve; });
      onAuth = async () => { entered(); await gate; };
      const first = finish.finishAccountDeletion(user.id, user.supabaseAuthId!);
      await started;
      const second = retry(user.id); const third = retry(user.id);
      try {
        let waiting = 0;
        for (let attempt = 0; attempt < 100; attempt++) {
          const [row] = await prisma.$queryRaw<Array<{ count: number }>>`
            SELECT count(*)::int AS count FROM pg_stat_activity
            WHERE datname = current_database() AND wait_event_type = 'Lock'
          `;
          waiting = row.count;
          if (waiting === 2) break;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        assert.equal(waiting, 2, "both admin retries must actually wait on the database lock");
      } finally {
        release();
        await Promise.all([first, second, third]);
        onAuth = undefined;
      }
      assert.equal(authCalls - calls, 1);
      assert.equal(await prisma.user.findUnique({ where: { id: user.id } }), null);
    });
    await t.test("existing nonpending users and mismatched Auth identity are rejected before external deletion", async () => {
      const calls = authCalls;
      for (const status of ["DISABLED", "APPROVED", "PENDING"] as const) {
        const { user } = await fixture(status); await assert.rejects(retry(user.id), /탈퇴 처리/);
        assert.ok(await prisma.user.findUnique({ where: { id: user.id } }));
      }
      const { user } = await fixture();
      await assert.rejects(finish.finishAccountDeletion(user.id, randomUUID()), /탈퇴 처리/);
      assert.equal(authCalls, calls);
    });
    await t.test("real admin guard rejects anonymous, researcher and expired admin sessions", async () => {
      const { user } = await fixture(); const calls = authCalls;
      for (session of [null, { user: { role: "RESEARCHER" } }, { user: { role: "ADMIN", adminSessionValid: false } }]) {
        await assert.rejects(retry(user.id), /Unauthorized/);
      }
      session = { user: { role: "ADMIN", adminSessionValid: true } };
      await assert.rejects(retry(-1), /유효한 회원 ID/);
      assert.equal(authCalls, calls);
      assert.ok(await prisma.user.findUnique({ where: { id: user.id } }));
    });
    await t.test("Auth failure leaves DB and storage intact", async () => {
      const { user, posts } = await fixture(); authFailure = true;
      try { await assert.rejects(retry(user.id), /Auth user deletion failed/); }
      finally { authFailure = false; }
      assert.equal(await prisma.post.count({ where: { authorId: user.id } }), 3);
      assert.ok(objects.has(posts[0].attachments[0].objectPath));
    });
  } finally {
    await db?.$disconnect();
    docker("rm", "--force", container);
  }
});
