import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { hasLocalMatch } from "next/dist/shared/lib/match-local-pattern";
import * as validation from "./home-introduction-validation";

function load<T>(path: string, dependencies: Record<string, unknown>, globals: Record<string, unknown> = {}): T {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { ...globals, exports, require(name: string) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports as T;
}

const id = "11111111-1111-4111-8111-111111111111";
const original = { image: { src: "/default.jpeg", width: 1507, height: 1848 }, message: "기본 문구", alt: "기본 설명" };
const uploaded = { id, localAsset: null, objectPath: `home-introduction/${id}.jpg`, contentType: "image/jpeg", size: 3, imageWidth: 200, imageHeight: 100, message: "적용 문구", altText: "적용 설명" };

function setup() {
  let content: (typeof uploaded & validation.HomeIntroductionDisplay) | null = uploaded;
  let fails = false;
  const logged: Error[] = [];
  const tags: string[] = [];
  const service = load<typeof import("./home-introduction-public")>("src/lib/home-introduction-public.ts", {
    "server-only": {},
    "next/cache": { cacheLife(profile: string) { assert.equal(profile, "minutes"); }, cacheTag(tag: string) { tags.push(tag); } },
    "next/navigation": { unstable_rethrow() {} },
    "@/lib/prisma": { prisma: { homeIntroductionSettings: { async findUnique() { if (fails) throw new Error("postgres://user:secret@private"); return content ? { currentContent: content } : null; } } } },
    "@/lib/site-content": { homeIntroduction: original },
    "@/lib/home-introduction": { HOME_INTRODUCTION_CACHE_TAG: "home-introduction" },
    "@/lib/home-introduction-validation": validation,
    "@/lib/server-log": { logServerError(_context: string, error: Error) { logged.push(error); } },
  });
  return { service, logged, tags, setContent(value: (typeof uploaded & validation.HomeIntroductionDisplay) | null) { content = value; }, fail() { fails = true; } };
}

test("공개 조회는 ID·이미지·문구·치수를 함께 반환하고 비밀 경로·signed URL을 전달하지 않는다", async () => {
  const ctx = setup();
  const result = await ctx.service.getPublicHomeIntroduction();
  assert.equal(result.id, id); assert.equal(result.image, `/home-introduction/${id}/image`);
  assert.equal(result.message, uploaded.message); assert.equal(result.altText, uploaded.altText);
  assert.equal(result.imageWidth, 200); assert.equal(result.imageHeight, 100);
  assert.deepEqual(ctx.tags, ["home-introduction"]);
  assert.doesNotMatch(JSON.stringify(result), /objectPath|token|secret|home-introduction\/.+\.jpg/);
});

test("표시용 콘텐츠는 실제 표시 치수를 공개하고 저장 경로는 공개하지 않는다", async () => {
  const ctx = setup();
  ctx.setContent({ ...uploaded, displayObjectPath: validation.homeIntroductionDisplayPath(id), displayContentType: "image/webp", displaySize: 2, displayWidth: 100, displayHeight: 50 });
  const dto = await ctx.service.getPublicHomeIntroduction();
  assert.equal(dto.imageWidth, 100); assert.equal(dto.imageHeight, 50);
  assert.equal(dto.image, `/home-introduction/${id}/image`);
  assert.doesNotMatch(JSON.stringify(dto), /ObjectPath|displaySize|display\.webp/);
});

test("미설정·조회 오류·저장 검증 실패는 기본 이미지와 문구로 함께 복구하며 로그는 비밀값을 숨긴다", async () => {
  const ctx = setup();
  for (const scenario of ["missing", "invalid", "database"]) {
    if (scenario === "missing") ctx.setContent(null);
    if (scenario === "invalid") ctx.setContent({ ...uploaded, imageWidth: 0 });
    if (scenario === "database") ctx.fail();
    const result = await ctx.service.getPublicHomeIntroduction();
    assert.equal(result.id, validation.DEFAULT_HOME_INTRODUCTION_ID);
    assert.equal(result.image, original.image); assert.equal(result.message, original.message);
    assert.equal(result.altText, original.alt); assert.equal(result.imageWidth, original.image.width);
  }
  assert.equal(ctx.logged.length, 3);
  assert.ok(ctx.logged.every((error) => !/secret|postgres:|private/.test(error.message)));
});

test("공개 이미지 응답은 현재 적용본만 허용하고 매 요청마다 포인터를 재확인한다", async () => {
  let current: (typeof uploaded & validation.HomeIntroductionDisplay) | null = uploaded;
  let downloads = 0;
  let fails = false;
  const logged: Error[] = [];
  const route = load<typeof import("../app/home-introduction/[id]/image/route")>("src/app/home-introduction/[id]/image/route.ts", {
    "@/lib/home-introduction-public": { async readCurrentHomeIntroduction() { if (fails) throw new Error("private:secret"); return current; } },
    "@/lib/home-introduction-validation": validation,
    "@/lib/supabase-storage": { async downloadHomeIntroductionImage(path: string) { assert.equal(path, uploaded.objectPath); downloads++; return new Uint8Array([255, 216, 255]); } },
    "@/lib/server-log": { logServerError(_context: string, error: Error) { logged.push(error); } },
  }, { Response });
  const request = new Request("http://test/image");
  const get = (imageId = id) => route.GET(request, { params: Promise.resolve({ id: imageId }) });
  const image = await get();
  assert.equal(image.status, 200); assert.equal((await image.arrayBuffer()).byteLength, 3);
  assert.equal(image.headers.get("cache-control"), "private, no-store");
  assert.equal(image.headers.get("content-type"), "image/jpeg");
  current = null;
  assert.equal((await get()).status, 404);
  current = { ...uploaded, id: "22222222-2222-4222-8222-222222222222" };
  assert.equal((await get()).status, 404);
  assert.equal((await get("invalid")).status, 404);
  assert.equal(downloads, 1);
  fails = true;
  const failure = await get();
  assert.equal(failure.status, 503); assert.equal(await failure.text(), "");
  assert.doesNotMatch(logged[0].message, /private|secret/);
});

test("공개·관리 이미지의 최적화 우회를 막고 기존 정적 이미지 최적화는 유지한다", () => {
  const config = load<typeof import("../../next.config")>("next.config.ts", {}, { process: { env: {} } });
  const patterns = config.default.images?.localPatterns;
  for (const path of [`/home-introduction/${id}/image`, `/admin/home-introduction/${id}/image`, `/%61dmin/home-introduction/${id}/image`, `/%68ome-introduction/${id}/image`]) {
    assert.equal(hasLocalMatch(patterns, path), false);
  }
  for (const path of ["/slide1.jpeg", "/_next/static/media/default.jpeg", "/founding-declaration/emblem.png", "/images/home/img1.jpg", "/images/brand/logo.png"]) {
    assert.equal(hasLocalMatch(patterns, path), true);
  }
});

test("공통 렌더러는 업로드 이미지를 최적화하지 않고 정적 기본 이미지는 최적화를 유지한다", () => {
  const optimized: boolean[] = [];
  const content = load<typeof import("../components/home/HomeIntroductionContent")>("src/components/home/HomeIntroductionContent.tsx", {
    react: React, "react/jsx-runtime": jsx,
    "next/image": { default: ({ unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => { optimized.push(!unoptimized); return React.createElement("img", { ...props, src: typeof props.src === "object" ? "/default.jpeg" : props.src }); } },
    "./HomeIntroductionSection.module.css": { default: {} },
  });
  const props = { imageWidth: 200, imageHeight: 100, message: "문구", altText: "설명" };
  renderToStaticMarkup(React.createElement(content.HomeIntroductionContent, { ...props, image: `/home-introduction/${id}/image` }));
  renderToStaticMarkup(React.createElement(content.HomeIntroductionContent, { ...props, image: original.image }));
  assert.deepEqual(optimized, [false, false, true, true]);
});

test("공개 section은 유지하고 콘텐츠 ID가 바뀌면 렌더러의 이미지 오류 상태를 새로 시작한다", async () => {
  let currentId = id;
  let connections = 0;
  const section = load<typeof import("../components/home/HomeIntroductionSection")>("src/components/home/HomeIntroductionSection.tsx", {
    react: React, "react/jsx-runtime": jsx,
    "next/server": { async connection() { connections++; } },
    "@/lib/home-introduction-public": { async getPublicHomeIntroduction() { return { id: currentId, image: "/same-image", imageWidth: 200, imageHeight: 100, message: "문구", altText: "설명" }; } },
    "./HomeIntroductionContent": { HomeIntroductionContent: () => null },
    "./HomeIntroductionSection.module.css": { default: { introduction: "introduction" } },
  });
  const outer = section.HomeIntroductionSection();
  assert.equal(outer.props.id, "home-introduction");
  const suspense = outer.props.children as React.ReactElement<{ children: React.ReactElement; fallback: React.ReactElement<{ "aria-hidden": string; className: string; role?: string; children?: React.ReactNode }> }>;
  assert.equal(suspense.props.fallback.type, "div");
  assert.equal(suspense.props.fallback.props["aria-hidden"], "true");
  assert.equal(suspense.props.fallback.props.role, undefined);
  assert.equal(suspense.props.fallback.props.children, undefined);
  assert.match(suspense.props.fallback.props.className, /h-full bg-black/);
  const render = suspense.props.children.type as () => Promise<React.ReactElement>;
  const first = await render();
  currentId = "22222222-2222-4222-8222-222222222222";
  const second = await render();
  assert.equal(first.key, id); assert.equal(second.key, currentId);
  assert.equal(connections, 2);
});
