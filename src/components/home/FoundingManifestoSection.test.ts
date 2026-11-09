import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsx from "react/jsx-runtime";
import ts from "typescript";

const reference = readFileSync("docs/references/founding-declaration.html", "utf8");
const css = readFileSync("src/components/home/FoundingManifestoSection.module.css", "utf8");

export function renderManifesto() {
  const exports = {} as { FoundingManifestoSection: () => React.ReactNode };
  runInNewContext(ts.transpileModule(readFileSync("src/components/home/FoundingManifestoSection.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require(name: string) {
    if (name === "react/jsx-runtime") return jsx;
    if (name.endsWith(".module.css")) return { default: new Proxy({}, { get: (_target, key) => `manifesto-${String(key)}` }) };
    if (name === "next/image") return { default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement("img", props) };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  return renderToStaticMarkup(React.createElement(exports.FoundingManifestoSection));
}

function articleText(html: string) {
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1];
  assert.ok(article, "declaration article exists");
  return article.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ").trim();
}

test("선언문은 확정된 축약 본문을 한 장으로 렌더링하고 제목·PDF 링크를 유지한다", () => {
  assert.equal(createHash("sha256").update(reference).digest("hex"), "d22f1127baf835c9b12295777127418d5905f70271f122823bbbbe372f58004b");
  const rendered = renderManifesto();
  // 2026-11-09 사용자가 확인한 단일 페이지 본문(공백 정규화)의 기준 해시.
  assert.equal(createHash("sha256").update(articleText(rendered)).digest("hex"), "3203a9ee05de2f959c7a30e36df724f495e7f9ac329ff931359818a14b23fb08");
  assert.match(rendered, /id="founding-manifesto" tabindex="-1"/);
  assert.equal((rendered.match(/<article\b/g) ?? []).length, 1);
  assert.equal((rendered.match(/<h2\b/g) ?? []).length, 1);
  assert.equal((rendered.match(/class="manifesto-sheet"/g) ?? []).length, 1);
  assert.equal((rendered.match(/<blockquote\b/g) ?? []).length, 2);
  assert.equal((rendered.match(/<strong\b/g) ?? []).length, 7);
  assert.doesNotMatch(rendered, /[123] \/ 3|mission-statement|founding-resolution|manifesto-pageNumber/);
  assert.match(rendered, /<time dateTime="2026-10-17"|<time datetime="2026-10-17"/);
  assert.match(rendered, /href="\/founding-manifesto.pdf" target="_blank" rel="noopener noreferrer"/);
  assert.match(rendered, /aria-label="창립선언문 원문 보기 \(PDF, 새 탭\)"/);
  assert.equal((rendered.match(/href="\/founding-manifesto.pdf"/g) ?? []).length, 1);
  assert.doesNotMatch(rendered, /<main\b|<h1\b|<script\b|data:|Downloads|<iframe\b/);
});

test("내장 로고·400/700 글꼴과 검증한 PDF는 원본 바이트를 유지한다", () => {
  const assets = [...reference.matchAll(/data:([^;]+);base64,([A-Za-z0-9+/=]+)/g)];
  const names = ["serif-regular.woff", "serif-bold.woff", "emblem.png", "wordmark.png"];
  assert.equal(assets.length, names.length);
  assets.forEach((asset, index) => {
    const local = readFileSync(`public/founding-declaration/${names[index]}`);
    assert.deepEqual(local, Buffer.from(asset[2], "base64"));
    assert.equal(local.subarray(0, 4).toString("latin1"), index < 2 ? "wOFF" : "\x89PNG");
  });
  assert.equal(createHash("sha256").update(readFileSync("public/founding-manifesto.pdf")).digest("hex"), "a72c910bfd4925a1119a2061f35949a336c61b1d5b0b3c0cbb07b4c31af5caad");
  assert.match(css, /serif-regular\.woff.*?font-weight: 400/);
  assert.match(css, /serif-bold\.woff.*?font-weight: 700/);
  assert.match(css, /font-family: 'MSM Serif', 'Batang', serif/);
  assert.doesNotMatch(css, /data:|https?:|@page|@media print|\bbody\s*\{/);
  const rendered = renderManifesto();
  assert.match(rendered, /src="\/founding-declaration\/emblem.png"/);
  assert.match(rendered, /src="\/founding-declaration\/wordmark.png"/);
});
