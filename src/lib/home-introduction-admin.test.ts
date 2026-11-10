import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

function load<T>(path: string, dependencies: Record<string, unknown>): T {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require(name: string) {
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
      async confirmHomeIntroductionUpload(id: string) { calls.push(`confirm:${id}`); return failure === "confirm" ? { ok: false, message: "검증 실패" } : { ok: true, id }; },
      async cancelHomeIntroductionUpload(id: string) { calls.push(`cancel:${id}`); return { ok: failure !== "cleanup" }; },
    },
    "@supabase/supabase-js": { createClient: () => ({ storage: { from: () => ({ async uploadToSignedUrl(path: string) {
      calls.push(`upload:${path}`);
      return { error: ["upload", "cleanup"].includes(failure) ? new Error("secret details") : null };
    } }) } }) },
  });
  const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
  const input = { contentType: file.type, size: file.size, message: "원문", altText: "설명" };
  assert.equal(await client.uploadHomeIntroductionFile(file, input), "new-id");
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
    "next/image": { default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement("img", props) },
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

test("관리 페이지는 인증 후에만 완료 묶음을 조회하고 일반 텍스트 목록을 표시한다", async () => {
  let allowed = true;
  let reads = 0;
  const page = load<typeof import("../app/admin/home-introduction/page")>("src/app/admin/home-introduction/page.tsx", {
    "react/jsx-runtime": jsx,
    "@/lib/admin-auth": { async requireAdmin() { if (!allowed) throw new Error("redirect"); } },
    "@/lib/prisma": { prisma: { homeIntroductionContent: { async findMany(query: { take: number; orderBy: unknown[] }) {
      reads++; assert.equal(query.take, 10); assert.equal(query.orderBy.length, 2);
      return [{ id: "1", message: "<b>보관 문구</b>", altText: "이미지 설명", imageWidth: 300, imageHeight: 400, createdAt: new Date("2026-11-10T00:00:00Z") }];
    } } } },
    "./HomeIntroductionForm": { HomeIntroductionForm: () => React.createElement("div", null, "등록 폼") },
  });
  const html = renderToStaticMarkup(await page.default());
  assert.match(html, /&lt;b&gt;보관 문구&lt;\/b&gt;/);
  assert.match(html, /300.*400px/);
  assert.doesNotMatch(html, /objectPath|secret|token/);
  allowed = false;
  await assert.rejects(page.default(), /redirect/);
  assert.equal(reads, 1);
});
