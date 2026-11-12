import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

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

test("업로드는 발급→전송→완료 순서이며 실패한 시도만 취소한다", async () => {
  const calls: string[] = [];
  let failure = "";
  const client = load<typeof import("./home-introduction-upload-client")>("src/lib/home-introduction-upload-client.ts", {
    "@/app/admin/home-introduction/actions": {
      async requestHomeIntroductionUpload() {
        calls.push("request");
        return failure === "request" ? { ok: false, message: "발급 실패" } : { ok: true, id: "new-id", path: "new-path", token: "test", supabaseUrl: "test", publishableKey: "test", bucket: "test" };
      },
      async confirmHomeIntroductionUpload(id: string) { calls.push(`confirm:${id}`); return failure === "confirm" ? { ok: false, message: "검증 실패" } : { ok: true, id, imageWidth: 20, imageHeight: 40 }; },
      async cancelHomeIntroductionUpload(id: string) { calls.push(`cancel:${id}`); return { ok: failure !== "cleanup" }; },
    },
    "@supabase/supabase-js": { createClient: () => ({ storage: { from: () => ({ async uploadToSignedUrl(path: string) {
      calls.push(`upload:${path}`);
      return { error: ["upload", "cleanup"].includes(failure) ? new Error("secret details") : null };
    } }) } }) },
  });
  const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
  const input = { contentType: file.type, size: file.size, message: "원문", altText: "설명" };
  assert.deepEqual({ ...await client.uploadHomeIntroductionFile(file, input) }, { id: "new-id", imageWidth: 20, imageHeight: 40 });
  assert.deepEqual(calls, ["request", "upload:new-path", "confirm:new-id"]);
  for (const step of ["request", "upload", "confirm", "cleanup"]) {
    failure = step; calls.length = 0;
    await assert.rejects(client.uploadHomeIntroductionFile(file, input), /[가-힣]/);
    assert.equal(calls.includes("cancel:new-id"), step !== "request");
    assert.equal(calls.includes("confirm:new-id"), step === "confirm");
  }
});

test("공통 렌더러는 실제 비율·문구·대체 텍스트와 두 이미지의 사각형 블러 구조를 공유한다", () => {
  const content = load<typeof import("../components/home/HomeIntroductionContent")>("src/components/home/HomeIntroductionContent.tsx", {
    "react/jsx-runtime": jsx, react: React,
    "next/image": { default: ({ unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => { assert.equal(unoptimized, true); return React.createElement("img", props); } },
    "./HomeIntroductionSection.module.css": { default: new Proxy({}, { get: (_target, key) => String(key) }) },
  });
  for (const [imageWidth, imageHeight] of [[1200, 600], [600, 1200], [600, 600]]) {
    const html = renderToStaticMarkup(React.createElement(content.HomeIntroductionContent, {
      image: "blob:preview", imageWidth, imageHeight, message: "<script>원문</script>\n둘째 줄", altText: "입력한 설명",
    }));
    assert.match(html, new RegExp(`aspect-ratio:${imageWidth} / ${imageHeight}`));
    assert.match(html, /class="image blurredImage"/);
    assert.match(html, /class="image sharpImage"/);
    assert.match(html, /alt="입력한 설명"/);
    assert.match(html, /&lt;script&gt;원문&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>|introduction-exit/);
  }
});

test("관리 페이지는 인증 후에만 보관 목록을 조회하고 현재·이전·미적용 상태를 표시한다", async () => {
  let allowed = true;
  let reads = 0;
  const initialDate = new Date("2026-11-10T00:00:00Z");
  const contents = [
    { id: "1", localAsset: "home-introduction.jpeg", message: "<b>기본 문구</b>", altText: "설명", imageWidth: 300, imageHeight: 400, createdAt: initialDate, lastAppliedAt: initialDate },
    { id: "2", localAsset: null, message: "보관 문구", altText: "보관 설명", imageWidth: 300, imageHeight: 400, createdAt: initialDate, lastAppliedAt: initialDate },
    { id: "3", localAsset: null, message: "미적용 문구", altText: "등록 설명", imageWidth: 300, imageHeight: 400, createdAt: initialDate, lastAppliedAt: null },
  ];
  const list = load<typeof import("../app/admin/home-introduction/HomeIntroductionList")>("src/app/admin/home-introduction/HomeIntroductionList.tsx", {
    "react/jsx-runtime": jsx, react: React, "next/navigation": { useRouter: () => ({}) },
    "next/image": { default: ({ unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized: boolean }) => { assert.equal(unoptimized, true); return React.createElement("img", props); } },
    "@/lib/site-content": { homeIntroduction: { image: "/default.jpg" } },
    "@/lib/interaction-lock": {}, "./actions": {},
  }, { Intl: { DateTimeFormat: class { constructor() { throw new Error("날짜 문구는 서버에서 전달해야 합니다."); } } } });
  const pagination = await import("./pagination");
  const page = load<typeof import("../app/admin/home-introduction/page")>("src/app/admin/home-introduction/page.tsx", {
    "react/jsx-runtime": jsx,
    "@/lib/admin-auth": { async requireAdmin() { if (!allowed) throw new Error("redirect"); } },
    "@/lib/home-introduction": { async getHomeIntroductionPage(requested: number) {
      reads++; assert.equal(requested, 2);
      return { contents, currentContentId: "1", page: 2, totalPages: 2, totalItems: 13 };
    } },
    "@/lib/pagination": pagination,
    "@/components/site/Pagination": { Pagination: ({ page, totalPages }: { page: number; totalPages: number }) => React.createElement("span", null, `${page}/${totalPages}`) },
    "./HomeIntroductionForm": { HomeIntroductionForm: () => React.createElement("div", null, "등록 폼") },
    "./HomeIntroductionList": list,
  });
  const props = { searchParams: Promise.resolve({ page: "2" }) };
  const html = renderToStaticMarkup(await page.default(props));
  assert.match(html, /&lt;b&gt;기본 문구&lt;\/b&gt;/);
  for (const label of ["현재 적용 중", "이전 적용본", "등록 · 미적용", "기본 콘텐츠", "아직 적용하지 않음", "2\/2"]) assert.ok(html.includes(label));
  assert.equal((html.match(/<button/g) ?? []).length, 2);
  assert.match(html, /src="\/admin\/home-introduction\/2\/image"/);
  assert.match(html, /src="\/default.jpg"/);
  assert.match(html, /<time dateTime="2026-11-10T00:00:00.000Z"|<time datetime="2026-11-10T00:00:00.000Z"/);
  assert.doesNotMatch(html, /objectPath|secret|token/);
  allowed = false;
  await assert.rejects(page.default(props), /redirect/);
  assert.equal(reads, 1);
});

test("적용 액션은 저장 실패와 캐시 실패를 구분하고 캐시 재시도는 재적용하지 않는다", async () => {
  let role = "ADMIN";
  let saved = 0;
  let invalidations = 0;
  let failSave = false;
  let failCache = false;
  const auth = load<typeof import("./admin-auth")>("src/lib/admin-auth.ts", {
    "../../auth": { auth: async () => role === "anonymous" ? null : { user: { role: role === "expired" ? "ADMIN" : role, adminSessionValid: role !== "expired" } } },
    "next/navigation": { unstable_rethrow() {} }, "@/lib/server-log": { logServerError() {} },
  }, { console: { error() {} } });
  const actions = load<typeof import("../app/admin/home-introduction/actions")>("src/app/admin/home-introduction/actions.ts", {
    "@/lib/admin-auth": auth,
    "@/lib/home-introduction-uploads": {},
    "@/lib/home-introduction": { HOME_INTRODUCTION_CACHE_TAG: "home-introduction", async applyHomeIntroductionContent() { if (failSave) throw new Error("secret DB detail"); saved++; } },
    "next/cache": { updateTag(tag: string) { assert.equal(tag, "home-introduction"); if (failCache) throw new Error("cache detail"); invalidations++; }, revalidatePath(path: string) { assert.ok(["/", "/admin/home-introduction"].includes(path)); invalidations++; } },
    "@/lib/server-log": { logServerError() {} },
  });
  for (const denied of ["RESEARCHER", "anonymous", "expired"]) {
    role = denied;
    await assert.rejects(actions.applyHomeIntroduction("id"), /Unauthorized/);
    await assert.rejects(actions.refreshHomeIntroductionCache(), /Unauthorized/);
  }
  assert.equal(saved, 0); assert.equal(invalidations, 0);
  role = "ADMIN"; failSave = true;
  const failure = await actions.applyHomeIntroduction("id");
  assert.equal(failure.status, "save-error"); assert.doesNotMatch(failure.message, /secret/);
  assert.equal(invalidations, 0);
  failSave = false; failCache = true;
  assert.equal((await actions.applyHomeIntroduction("id")).status, "cache-error");
  assert.equal(saved, 1);
  failCache = false;
  assert.equal((await actions.refreshHomeIntroductionCache()).status, "success");
  assert.equal(saved, 1); assert.equal(invalidations, 3);
  assert.equal((await actions.applyHomeIntroduction("id")).status, "success");
  assert.equal(saved, 2); assert.equal(invalidations, 6);
});

test("보관 이미지 경로는 관리자만 접근하고 private no-store로 축소 이미지를 제공한다", async () => {
  const validation = await import("./home-introduction-validation");
  const id = "11111111-1111-4111-8111-111111111111";
  const { default: sharp } = await import("sharp");
  const bytes = await sharp({ create: { width: 1200, height: 600, channels: 3, background: "white" } }).jpeg().toBuffer();
  const displayBytes = await sharp(bytes).webp({ quality: 80 }).toBuffer();
  let useDisplay = false;
  let allowed = true;
  let reads = 0;
  let downloads = 0;
  let missing = false;
  let failDownload = false;
  class AdminUnauthorizedError extends Error {}
  const route = load<typeof import("../app/admin/home-introduction/[id]/image/route")>("src/app/admin/home-introduction/[id]/image/route.ts", {
    "@/lib/admin-auth": { AdminUnauthorizedError, async assertAdmin() { if (!allowed) throw new AdminUnauthorizedError(); } },
    "@/lib/prisma": { prisma: { homeIntroductionContent: { async findUnique() { reads++; return missing ? null : {
      id, objectPath: `home-introduction/${id}.jpg`, localAsset: null, contentType: "image/jpeg", size: bytes.length, imageWidth: 1200, imageHeight: 600, message: "문구", altText: "설명",
      ...(useDisplay ? { displayObjectPath: validation.homeIntroductionDisplayPath(id), displayContentType: "image/webp", displaySize: displayBytes.length, displayWidth: 1200, displayHeight: 600 } : {}),
    }; } } } },
    "@/lib/home-introduction-validation": validation,
    "@/lib/supabase-storage": { async downloadHomeIntroductionImage() { downloads++; if (failDownload) throw new Error("private object path"); return useDisplay ? displayBytes : bytes; } },
    "@/lib/server-log": { logServerError() {} },
    "sharp": { default: sharp },
  }, { Response, URL });
  const request = new Request("http://test/image");
  const props = { params: Promise.resolve({ id }) };
  allowed = false;
  assert.equal((await route.GET(request, props)).status, 401);
  assert.equal(reads, 0);
  allowed = true;
  assert.equal((await route.GET(request, { params: Promise.resolve({ id: "invalid" }) })).status, 404);
  missing = true;
  assert.equal((await route.GET(request, props)).status, 404);
  assert.equal(downloads, 0);
  missing = false;
  const image = await route.GET(request, props);
  assert.equal(image.status, 200); assert.equal(image.headers.get("cache-control"), "private, no-store");
  assert.equal(image.headers.get("content-type"), "image/webp");
  const thumbnail = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
  assert.equal(thumbnail.width, 256); assert.equal(thumbnail.height, 128);
  useDisplay = true;
  const previewRequest = new Request("http://test/image?preview=1");
  const preview = await route.GET(previewRequest, props);
  assert.equal(preview.status, 200); assert.equal(preview.headers.get("content-type"), "image/webp");
  assert.deepEqual(Buffer.from(await preview.arrayBuffer()), displayBytes);
  allowed = false;
  assert.equal((await route.GET(previewRequest, props)).status, 401);
  allowed = true;
  failDownload = true;
  const failure = await route.GET(request, props);
  assert.equal(failure.status, 500); assert.equal(await failure.text(), "");
});

test("등록 확인은 저장 완료 뒤에만 관리자 router를 갱신하고 공개 캐시는 바꾸지 않는다", async () => {
  const calls: string[] = [];
  let fail = false;
  const actions = load<typeof import("../app/admin/home-introduction/actions")>("src/app/admin/home-introduction/actions.ts", {
    "@/lib/admin-auth": { async assertAdmin() { return { user: { id: "admin" } }; } },
    "@/lib/home-introduction": {},
    "@/lib/home-introduction-uploads": { async completeHomeIntroductionUpload() { calls.push("save"); if (fail) throw new Error("DB failed"); return { id: "saved-id" }; } },
    "next/cache": { refresh() { calls.push("refresh"); }, revalidatePath() { assert.fail("registration must not invalidate publication paths"); }, updateTag() { assert.fail("registration must not invalidate public content"); } },
    "@/lib/server-log": { logServerError() {} },
  });
  assert.equal((await actions.confirmHomeIntroductionUpload("id")).ok, true);
  assert.deepEqual(calls, ["save", "refresh"]);
  calls.length = 0; fail = true;
  assert.equal((await actions.confirmHomeIntroductionUpload("id")).ok, false);
  assert.deepEqual(calls, ["save"]);
});

test("적용 성공은 서버 재검증으로 갱신하고 캐시 오류 때만 현재 상태를 다시 조회한다", async () => {
  let status = "success";
  let refreshes = 0;
  const { acquireLock } = await import("./interaction-lock");
  const list = load<typeof import("../app/admin/home-introduction/HomeIntroductionList")>("src/app/admin/home-introduction/HomeIntroductionList.tsx", {
    "react/jsx-runtime": jsx,
    react: { useRef: () => ({ current: false }), useState: () => [null, () => {}] },
    "next/navigation": { useRouter: () => ({ refresh() { refreshes++; } }) },
    "next/image": { default: () => null },
    "@/lib/site-content": { homeIntroduction: { image: "/default.jpg" } },
    "@/lib/interaction-lock": { acquireLock },
    "./actions": { async applyHomeIntroduction() { return { status, message: "result" }; } },
  });
  function buttons(node: React.ReactNode): React.ReactElement<{ onClick(): void }>[] {
    if (Array.isArray(node)) return node.flatMap(buttons);
    if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return [];
    if (node.type === "button") return [node as React.ReactElement<{ onClick(): void }>];
    return buttons(node.props.children);
  }
  for (status of ["success", "save-error", "cache-error"]) {
    refreshes = 0;
    const tree = list.HomeIntroductionList({ currentContentId: "other", contents: [{
      id: "test", localAsset: null, message: "문구", altText: "설명", imageWidth: 1, imageHeight: 1,
      createdAt: "2026-11-11", lastAppliedAt: null, createdAtLabel: "등록일", lastAppliedAtLabel: null,
    }] });
    buttons(tree)[0].props.onClick();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(refreshes, status === "cache-error" ? 1 : 0);
  }
});
