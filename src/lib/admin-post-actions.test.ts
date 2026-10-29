import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import * as enums from "@/generated/prisma/enums";
import * as adminPosts from "@/lib/admin-posts";

const initial = { status: "idle" as const, message: "" };

function setup() {
  let role = "ADMIN";
  let duplicate = false;
  let failure: unknown = null;
  let writes = 0;
  let invalidations = 0;
  const logged: unknown[] = [];
  const authExports = {};
  runInNewContext(ts.transpileModule(readFileSync("src/lib/admin-auth.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports: authExports, console: { error() {} }, require(name: string) {
    if (name === "../../auth") return { auth: async () => role === "anonymous" ? null : { user: { role: role === "expired" ? "ADMIN" : role, adminSessionValid: role !== "expired" } } };
    if (name === "next/navigation") return { unstable_rethrow() {}, redirect() { throw new Error("redirect"); } };
    if (name === "@/lib/server-log") return { logServerError() {} };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  const exports = {};
  const dependencies: Record<string, unknown> = {
    "next/cache": { revalidatePath() { invalidations++; }, updateTag() { invalidations++; } },
    "next/navigation": { unstable_rethrow() {}, redirect() { throw new Error("redirect"); } },
    "@/generated/prisma/enums": enums,
    "@/lib/admin-auth": authExports,
    "@/lib/admin-posts": adminPosts,
    "@/lib/posts": { getPublishedPostsCacheTag: () => "tag" },
    "@/lib/supabase-storage": { removeResearchObjects: async () => {} },
    "@/lib/server-log": { logServerError(_context: string, error: unknown) { logged.push(error); } },
    "@/lib/prisma": { prisma: {
      category: { async findFirst() { return { id: 1, postType: enums.PostType.NOTICE }; } },
      post: {
        async findUnique() { return duplicate ? { id: 2 } : null; },
        async findFirst({ where }: { where: { slug?: string } }) { return where.slug ? (duplicate ? { id: 2 } : null) : { id: 1, type: enums.PostType.NOTICE, publishedAt: null }; },
        async create() { if (failure) throw failure; writes++; },
        async updateMany() { if (failure) throw failure; writes++; return { count: 1 }; },
      },
    } },
  };
  runInNewContext(ts.transpileModule(readFileSync("src/app/admin/posts/actions.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, console, require(name: string) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return { actions: exports as typeof import("@/app/admin/posts/actions"), logged,
    setRole(value: string) { role = value; }, setDuplicate(value: boolean) { duplicate = value; },
    setFailure(value: unknown) { failure = value; }, get writes() { return writes; }, get invalidations() { return invalidations; } };
}

function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ id: "1", title: "제목", slug: "valid-slug", summary: "요약", content: "본문", categoryId: "1", intent: "publish" })) data.set(key, value);
  return data;
}

test("생성·수정 액션은 입력·권한·중복·저장 오류를 구분하고 실패 시 성공 처리하지 않는다", async () => {
  for (const actionName of ["createPost", "updatePost"] as const) {
    const ctx = setup();
    const action = ctx.actions[actionName];
    for (const key of ["title", "slug", "content", "categoryId"]) {
      const data = form(); data.set(key, "   ");
      assert.equal((await action(initial, data)).status, "validation");
    }
    for (const role of ["expired", "RESEARCHER", "anonymous"]) {
      ctx.setRole(role);
      assert.equal((await action(initial, form())).status, "auth");
    }
    ctx.setRole("ADMIN");
    ctx.setDuplicate(true);
    assert.match((await action(initial, form())).message, /이미 사용 중인 슬러그/);
    ctx.setDuplicate(false);
    ctx.setFailure({ code: "P2002" });
    assert.match((await action(initial, form())).message, /이미 사용 중인 슬러그/);
    ctx.setFailure(new Error("DB secret detail"));
    const result = await action(initial, form());
    assert.equal(result.status, "error");
    assert.doesNotMatch(result.message, /secret/);
    assert.equal(ctx.logged.length, 1);
    assert.equal(ctx.writes, 0);
    assert.equal(ctx.invalidations, 0);
    ctx.setFailure(null);
    await assert.rejects(action(initial, form()), /redirect/);
    assert.equal(ctx.writes, 1);
    assert.ok(ctx.invalidations > 0);
  }
});
