import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsx from "react/jsx-runtime";
import ts from "typescript";
import * as enums from "../../src/generated/prisma/enums";
import * as pagination from "../../src/lib/pagination";
import * as researchFiles from "../../src/lib/research-files";
import type { BoardPostDetail } from "../../src/lib/posts";

const require = createRequire(import.meta.url);
export const hiddenSummary = "LEGACY_SUMMARY_MUST_NOT_RENDER";
export function createReadingFixture() {
  const fileId = "ac34e114-f0ee-4a76-94a8-51460959a393";
  const post: BoardPostDetail = {
    id: 42, slug: "life-research-material-guide", title: "검증용 긴 제목 ".repeat(15),
    category: "검증 분류", categorySlug: "test", summary: hiddenSummary,
    content: "검증용 본문입니다. 임의 HTML <script>실행 금지</script>\n둘째 문단입니다.",
    publishedAt: "2026-11-06", isPinned: false, authorName: "검증 작성자", authorId: 1,
    attachmentCount: 1, attachments: [{
      id: fileId, kind: enums.AttachmentKind.ATTACHMENT, originalName: "긴_첨부파일명_".repeat(12) + ".pdf",
      contentType: "application/pdf", size: 2048, altText: null, imageWidth: null, imageHeight: null, url: "/fixture.pdf",
    }],
  };
  const rows = [post];
  const modules = new Map<string, unknown>();
  const dependencies: Record<string, unknown> = {
    "react": React, "react/jsx-runtime": jsx,
    "next/link": { default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => React.createElement("a", props, children) },
    "next/image": { default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => {
      const imageProps = { ...props };
      delete imageProps.unoptimized;
      return React.createElement("img", imageProps);
    } },
    "next/navigation": { notFound() { throw new Error("404"); }, useRouter: () => ({ push() {}, refresh() {} }) },
    "next/server": { connection: async () => {} },
    "@/generated/prisma/enums": enums,
    "@/lib/pagination": pagination, "@/lib/research-files": researchFiles,
    "@/lib/researcher-auth": { getApprovedResearcher: async () => null, requireResearcher: async () => ({ id: 1 }) },
    "@/lib/admin-auth": { requireAdmin: async () => {} },
    "@/lib/server-log": { logServerError() {} },
    "@/lib/prisma": { prisma: { post: {
      count: async () => rows.length,
      findMany: async () => rows.map((row) => ({ ...row, type: enums.PostType.RESEARCH, status: enums.PostStatus.PUBLISHED, updatedAt: new Date("2026-11-06"), category: { name: "검증 분류" }, author: { name: row.authorName } })),
    } } },
    "@/lib/posts": {
      getPublishedPostPage: async () => ({ posts: rows, page: 1, totalPages: 1, totalItems: rows.length, offset: 0 }),
      getPublishedPostBySlug: async () => rows[0] ?? null,
      getPublishedPostMetadataBySlug: async () => rows[0] ?? null,
      getPublishedPostPreview: async () => rows,
    },
  };
  function load<T>(filename: string): T {
    const absolute = path.resolve(filename);
    if (modules.has(absolute)) return modules.get(absolute) as T;
    if (absolute.endsWith(".module.css")) return { default: new Proxy({}, { get: (_target, key) => `ready56-${String(key)}` }) } as T;
    if (absolute.endsWith("/posts/actions.ts")) return { archivePost: async () => {}, deletePost: async () => ({ status: "idle", message: "" }) } as T;
    const exports = {};
    modules.set(absolute, exports);
    runInNewContext(ts.transpileModule(readFileSync(absolute, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, { exports, process, console, require(name: string) {
      if (name in dependencies) return dependencies[name];
      if (name.startsWith("@/") || name.startsWith(".")) {
        const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(absolute), name);
        const target = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => existsSync(candidate));
        if (!target) throw new Error(`Missing fixture dependency: ${base}`);
        return load(target);
      }
      return require(name);
    } });
    return exports as T;
  }
  async function render(route: string) {
    const page = load<{ default: (props: object) => Promise<React.ReactNode> }>(`src/app/${route}/page.tsx`);
    return renderToStaticMarkup(await page.default({ params: Promise.resolve({ slug: post.slug }), searchParams: Promise.resolve({}) }));
  }
  return { post, rows, load, render };
}
