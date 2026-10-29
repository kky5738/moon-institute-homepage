import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsx from "react/jsx-runtime";
import ts from "typescript";
import * as enums from "@/generated/prisma/enums";
import * as helpers from "@/lib/admin-posts";

function load<T>(path: string, dependencies: Record<string, unknown>): T {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, console, require(name: string) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports as T;
}

const categories = [
  { id: 1, name: "공지", postType: enums.PostType.NOTICE, isActive: true },
  { id: 2, name: "자료", postType: enums.PostType.PROMOTION, isActive: true },
  { id: 3, name: "연구", postType: enums.PostType.RESEARCH, isActive: true },
  { id: 4, name: "비활성", postType: enums.PostType.NOTICE, isActive: false },
];
type CategoryWhere = { id?: number; isActive: boolean; postType: { in: enums.PostType[] } };
const matches = (category: typeof categories[number], where: CategoryWhere) =>
  (where.id === undefined || category.id === where.id) && category.isActive === where.isActive && where.postType.in.includes(category.postType);

function setup(available = categories) {
  const writes: Array<{ type: enums.PostType; status: enums.PostStatus; categoryId: number }> = [];
  const prisma = {
    category: {
      async findFirst({ where }: { where: CategoryWhere }) { return available.find((category) => matches(category, where)) ?? null; },
      async findMany({ where }: { where: CategoryWhere }) { return available.filter((category) => matches(category, where)); },
    },
    post: { async findUnique() { return null; }, async create({ data }: { data: typeof writes[number] }) { writes.push(data); } },
  };
  const actions = load<typeof import("@/app/admin/posts/actions")>("src/app/admin/posts/actions.ts", {
    "next/cache": { revalidatePath() {}, updateTag() {} },
    "next/navigation": { unstable_rethrow() {}, redirect() { throw new Error("redirect"); } },
    "@/generated/prisma/enums": enums, "@/lib/admin-auth": { assertAdmin: async () => {}, AdminUnauthorizedError: class extends Error {} },
    "@/lib/admin-posts": helpers, "@/lib/prisma": { prisma },
    "@/lib/posts": { getPublishedPostsCacheTag: () => "tag" },
    "@/lib/server-log": { logServerError() {} }, "@/lib/supabase-storage": { removeResearchObjects() {} },
  });
  const link = { default: ({ children }: { children: React.ReactNode }) => React.createElement("a", null, children) };
  const postForm = load<typeof import("@/app/admin/posts/post-form")>("src/app/admin/posts/post-form.tsx", {
    "react/jsx-runtime": jsx, react: React, "next/link": link, "./actions": actions,
    "@/components/ui/pending-button": { PendingButton: ({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) => React.createElement("button", { disabled }, children) },
  });
  const page = load<typeof import("@/app/admin/posts/new/page")>("src/app/admin/posts/new/page.tsx", {
    "react/jsx-runtime": jsx, "next/link": link, "next/server": { connection: async () => {} },
    "@/lib/admin-auth": { requireAdmin: async () => {} }, "@/lib/admin-posts": helpers,
    "@/lib/prisma": { prisma }, "@/lib/server-log": { logServerError() {} }, "../post-form": postForm,
  });
  return { actions, page, writes };
}

function form(categoryId: number, intent: string) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ title: "제목", slug: "test-slug", content: "본문", categoryId: String(categoryId), intent })) data.set(key, value);
  return data;
}

test("생성 액션은 연구·비활성·없는 카테고리를 거부하고 공지·홍보 유형으로 저장한다", async () => {
  const { actions, writes } = setup();
  for (const id of [3, 4, 999]) {
    assert.equal((await actions.createPost({ status: "idle", message: "" }, form(id, "publish"))).status, "validation");
  }
  assert.equal(writes.length, 0);
  for (const [id, type] of [[1, enums.PostType.NOTICE], [2, enums.PostType.PROMOTION]] as const) {
    for (const [intent, status] of [["draft", enums.PostStatus.DRAFT], ["publish", enums.PostStatus.PUBLISHED]] as const) {
      await assert.rejects(actions.createPost({ status: "idle", message: "" }, form(id, intent)), /redirect/);
      const saved = writes.at(-1);
      assert.equal(saved?.categoryId, id);
      assert.equal(saved?.type, type);
      assert.equal(saved?.status, status);
    }
  }
});

test("새 글 화면에는 허용 카테고리만 표시하고 없으면 저장 버튼을 막는다", async () => {
  const html = renderToStaticMarkup(await setup().page.default());
  assert.match(html, /공지사항 \/ 공지/);
  assert.match(html, /홍보자료 \/ 자료/);
  assert.doesNotMatch(html, /연구|비활성/);
  const empty = renderToStaticMarkup(await setup(categories.slice(2)).page.default());
  assert.match(empty, /활성 카테고리가 없습니다/);
  assert.match(empty, /<select[^>]*disabled/);
  assert.equal((empty.match(/<button[^>]*disabled/g) ?? []).length, 2);
});
