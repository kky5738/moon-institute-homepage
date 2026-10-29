import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as enums from "@/generated/prisma/enums";
import * as guides from "@/lib/material-guides";
import * as pagination from "@/lib/pagination";
import * as postSlug from "@/lib/post-slug";

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

test("일반 홍보자료 공개·수정·비공개와 페이지 및 선별 연결", async () => {
  const rows = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1, slug: i === 0 ? "life-research-material-guide" : `new-material-${i}`,
    title: `자료 ${i}`, summary: `요약 ${i}`, content: `본문 ${i}`, type: enums.PostType.PROMOTION,
    status: enums.PostStatus.PUBLISHED, deletedAt: null, isPinned: false,
    publishedAt: new Date("2026-01-01"), createdAt: new Date("2026-01-01"),
    category: null, author: null, authorId: null, attachments: [], _count: { attachments: 0 },
  }));
  type Where = { type: string; status: string; slug: string | { notIn: string[]; in?: string[] } };
  const matches = (row: typeof rows[number], where: Where) =>
    row.type === where.type && row.status === where.status && row.deletedAt === null &&
    (typeof where.slug === "string" ? row.slug === where.slug :
      !where.slug.notIn.includes(row.slug) && (!where.slug.in || where.slug.in.includes(row.slug)));
  const posts = load<typeof import("@/lib/posts")>("src/lib/posts.ts", {
    "next/cache": { cacheLife() {}, cacheTag() {} }, "@/generated/prisma/enums": enums,
    "@/lib/pagination": pagination, "@/lib/post-slug": postSlug,
    "@/lib/prisma": { prisma: { post: {
      count: async ({ where }: { where: Where }) => rows.filter((row) => matches(row, where)).length,
      findMany: async ({ where, skip = 0, take }: { where: Where; skip?: number; take: number }) => rows.filter((row) => matches(row, where)).slice(skip, skip + take),
      findFirst: async ({ where }: { where: Where }) => rows.find((row) => matches(row, where)) ?? null,
    } } },
    "@/lib/public-post-attachments": { getPublicPostAttachmentWhere: () => ({}) },
    "@/lib/server-log": { logServerError() {}, isPrismaMissingTableError: () => false },
    "@/lib/supabase-storage": { createResearchFileUrls: async () => [] },
  });
  const jsx = await import("react/jsx-runtime");
  const link = { default: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement("a", { href }, children) };
  const common = { "react/jsx-runtime": jsx, "next/link": link, "@/generated/prisma/enums": enums,
    "@/lib/material-guides": guides, "@/lib/posts": posts };
  const card = load<typeof import("@/components/materials/MaterialArchiveCard")>("src/components/materials/MaterialArchiveCard.tsx", { ...common,
    "@/components/ui/badge": { Badge: ({ children }: { children: React.ReactNode }) => React.createElement("span", null, children) },
    "@/components/ui/button": { buttonVariants: () => "" },
    "@/components/ui/card": { Card: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children) },
  });
  const list = load<typeof import("@/app/materials/page")>("src/app/materials/page.tsx", { ...common, "@/lib/pagination": pagination,
    "@/components/materials/MaterialArchiveCard": card,
    "@/components/site/Pagination": { Pagination: ({ totalPages }: { totalPages: number }) => React.createElement("span", null, `pages:${totalPages}`) },
    "@/components/ui/button": { buttonVariants: () => "" },
    "@/components/ui/card": { Card: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children) },
  });
  const detail = load<typeof import("@/app/materials/[slug]/page")>("src/app/materials/[slug]/page.tsx", { ...common,
    "next/navigation": { notFound: () => { throw new Error("404"); } },
    "@/components/materials/RecommendedMaterialList": { RecommendedMaterialList: () => React.createElement("div", null, "추천 자료") },
  });
  const listing = async (page = "1") => renderToStaticMarkup(await list.default({ searchParams: Promise.resolve({ page }) }));
  const view = async (slug: string) => renderToStaticMarkup(await detail.default({ params: Promise.resolve({ slug }) }));
  assert.match(await listing(), /new-material-1/);
  assert.match(await listing(), /pages:2/);
  assert.match(await listing("2"), /new-material-10/);
  assert.match(await view("new-material-1"), /본문 1/);
  assert.doesNotMatch(await view("new-material-1"), /해설 요약/);
  assert.match(await view("life-research-material-guide"), /해설 요약/);
  assert.match(await view("life-research-material-guide"), /추천 자료/);
  rows[1].title = "수정 제목"; rows[1].content = "수정 본문";
  assert.match(await listing(), /수정 제목/);
  assert.match(await view("new-material-1"), /수정 본문/);
  for (const state of ["draft", "archived", "deleted"]) {
    rows[1].status = state === "draft" ? enums.PostStatus.DRAFT : state === "archived" ? enums.PostStatus.ARCHIVED : enums.PostStatus.PUBLISHED;
    rows[1].deletedAt = state === "deleted" ? new Date() : null;
    assert.doesNotMatch(await listing(), /new-material-1"/);
    await assert.rejects(() => view("new-material-1"), /404/);
  }
});
