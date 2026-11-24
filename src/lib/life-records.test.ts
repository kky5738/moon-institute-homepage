import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as validation from "./life-record-validation";
import * as pagination from "./pagination";

function load<T>(path: string, dependencies: Record<string, unknown>): T {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, Response, Uint8Array, Date, require(name: string) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports as T;
}

const id = "00000000-0000-4000-8000-000000000001";
function form(values: Record<string, string> = {}) {
  const result = new FormData();
  for (const [key, value] of Object.entries({ title: "탄생", intent: "draft", ...values })) result.set(key, value);
  return result;
}

test("초안은 제목만 저장하고 공개·홈 카드에는 필요한 내용을 요구한다", () => {
  assert.equal(validation.parseLifeRecordForm(form()).status, "DRAFT");
  assert.throws(() => validation.parseLifeRecordForm(form({ intent: "publish" })), /연도/);
  const publish = { intent: "publish", year: "1920", summary: "검증용 요약", content: "검증용 본문" };
  assert.equal(validation.parseLifeRecordForm(form(publish)).status, "PUBLISHED");
  assert.throws(() => validation.parseLifeRecordForm(form({ ...publish, featured: "on" })), /대표 사진/);
  assert.throws(() => validation.parseLifeRecordForm(form({ ...publish, coverImageId: id })), /대체 설명/);
  assert.equal(validation.parseLifeRecordForm(form({ ...publish, featured: "on", coverImageId: id, imageAlt: "사진 설명" })).featured, true);
  assert.equal(validation.parseLifeRecordForm(form({ intent: "archive" })).status, "ARCHIVED");
  const invalid: Record<string, string>[] = [{ year: "19e2" }, { year: "-123" }, { summary: "가".repeat(201) }, { intent: "other" }, { sortOrder: "-1" }, { coverImageId: "bad" }];
  for (const values of invalid) {
    assert.throws(() => validation.parseLifeRecordForm(form(values)), validation.LifeRecordValidationError);
  }
});

test("검색 조건을 정규화하고 페이지 이동 주소에 안전하게 유지한다", () => {
  const search = validation.parseLifeRecordSearch({ q: " 성혼 & 기록 ", year: "1960" });
  assert.deepEqual(search, { q: "성혼 & 기록", year: 1960 });
  const url = new URL(validation.lifeRecordSearchPath("/life", search), "https://example.com");
  assert.equal(url.searchParams.get("q"), "성혼 & 기록");
  assert.equal(url.searchParams.get("year"), "1960");
  assert.deepEqual(validation.parseLifeRecordSearch({ q: ["a"], year: "-001" }), { q: "", year: null });
});

test("홈·목록·상세는 공개 기록만 조회하고 1,000건도 페이지 크기만 읽는다", async () => {
  const queries: Array<Record<string, unknown>> = [];
  const service = load<typeof import("./life-records")>("src/lib/life-records.ts", {
    "server-only": {}, "next/cache": { cacheLife() {}, cacheTag() {} },
    "@/lib/prisma": { prisma: { lifeRecord: {
      async count(args: Record<string, unknown>) { queries.push(args); return 1000; },
      async findMany(args: Record<string, unknown>) { queries.push(args); return []; },
      async findFirst(args: Record<string, unknown>) { queries.push(args); return null; },
    } } },
    "@/lib/pagination": pagination, "@/lib/life-record-validation": validation,
    "@/lib/server-log": { isPrismaMissingTableError: () => false },
  });
  await service.getLifeHighlights();
  const result = await service.getLifeRecordPage(2, { q: "탄생", year: 1920 });
  await service.getPublishedLifeRecord("private-draft");
  assert.equal(result.totalItems, 1000);
  assert.equal(result.page, 2);
  assert.ok(queries.every(q => (q.where as { status: string }).status === "PUBLISHED"));
  assert.equal(validation.MAX_HOME_LIFE_RECORDS, 9);
  assert.deepEqual(JSON.parse(JSON.stringify(queries[0].orderBy)), [{ sortOrder: "asc" }, { year: "asc" }, { id: "asc" }]);
  assert.equal((queries[0].where as { featured: boolean }).featured, true);
  assert.equal(queries[0].take, validation.MAX_HOME_LIFE_RECORDS);
  assert.equal(queries[2].take, pagination.POSTS_PER_PAGE);
  assert.equal(queries[2].skip, 10);
  assert.deepEqual(Object.keys(queries[2].select as object), ["id", "slug", "title", "year", "summary"]);
});

test("카드와 상세는 같은 고유 주소를 사용하고 입력 HTML을 실행하지 않는다", () => {
  const styles = { default: new Proxy({}, { get: (_t, key) => String(key) }) };
  const deps = {
    "react/jsx-runtime": jsx, "./life.module.css": styles,
    "next/link": { default: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => React.createElement("a", props) },
    "next/image": { default: ({ unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => {
      assert.equal(unoptimized, true); return React.createElement("img", props);
    } },
  };
  const record = { id, slug: "birth", title: "<script>제목</script>", year: 1920, dateLabel: "원문 날짜", summary: "요약", imageAlt: "사진 설명", coverImage: { id, imageWidth: 20, imageHeight: 30 }, content: "<img onerror=alert(1)>본문", source: "자료명" };
  const { LifeEventCard } = load<typeof import("../components/life/LifeEventCard")>("src/components/life/LifeEventCard.tsx", deps);
  const html = renderToStaticMarkup(React.createElement(LifeEventCard, { record }));
  assert.match(html, /href="\/life\/birth"/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /src="\/life-images\//);
  const { LifeRecordDocument } = load<typeof import("../components/life/LifeRecordDocument")>("src/components/life/LifeRecordDocument.tsx", deps);
  const document = renderToStaticMarkup(React.createElement(LifeRecordDocument, { record }));
  assert.match(document, /&lt;img onerror/);
  assert.doesNotMatch(document, /<img onerror/);
});

test("미인증 요청은 저장과 사진 작업에 도달하지 못한다", async () => {
  class Unauthorized extends Error {}
  let calls = 0;
  const mutation = () => { calls++; throw new Error("must not run"); };
  const actions = load<typeof import("../app/admin/life-events/actions")>("src/app/admin/life-events/actions.ts", {
    "node:crypto": { randomUUID: () => id }, "next/cache": {}, "next/navigation": { unstable_rethrow() {} },
    "@/lib/admin-auth": { AdminUnauthorizedError: Unauthorized, assertAdmin: async () => { throw new Unauthorized(); } },
    "@/lib/post-slug": {}, "@/lib/life-records": { saveLifeRecord: mutation }, "@/lib/life-record-validation": validation,
    "@/lib/life-record-images": { prepareLifeImage: mutation, completeLifeImage: mutation, discardLifeImage: mutation },
    "@/lib/server-log": { logServerError() {} },
  });
  assert.match((await actions.saveLifeRecordAction({ message: "" }, form())).message, /로그인/);
  await assert.rejects(actions.requestLifeImage({ recordId: id, name: "a.jpg", size: 1, contentType: "image/jpeg" }), Unauthorized);
  await assert.rejects(actions.confirmLifeImage(id), Unauthorized);
  await assert.rejects(actions.cancelLifeImage(id), Unauthorized);
  assert.equal(calls, 0);
});

test("홈 준비 카드는 링크 없이 3개를 표시하고 실제 기록 1~2개는 충원하지 않는다", () => {
  const section = load<typeof import("../components/home/LifeHighlightsSection")>("src/components/home/LifeHighlightsSection.tsx", {
    "react/jsx-runtime": jsx,
    "next/link": { default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) },
    "./LifeHighlightsFrame": { LifeHighlightsFrame: ({ children }: { children: React.ReactNode }) => React.createElement("ol", null, React.Children.map(children, child => React.createElement("li", null, child))) },
    "@/components/life/LifeEventCard": { LifeEventCard: ({ record }: { record: { slug: string } }) => React.createElement("a", { href: `/life/${record.slug}` }, record.slug) },
    "@/lib/life-records": {}, "@/components/life/life.module.css": { default: {} },
  });
  const empty = renderToStaticMarkup(React.createElement(section.LifeHighlightsSection, { records: [] }));
  assert.equal((empty.match(/<li/g) ?? []).length, 3);
  assert.equal((empty.match(/콘텐츠 준비 중/g) ?? []).length, 1);
  assert.equal((empty.match(/<a /g) ?? []).length, 1);
  assert.match(empty, /href="\/life"/);
  assert.doesNotMatch(empty, /<button|tabindex/i);
  for (const count of [1, 2]) {
    const records = Array.from({ length: count }, (_, i) => ({ id: String(i), slug: `record-${i}` })) as Parameters<typeof section.LifeHighlightsSection>[0]["records"];
    const html = renderToStaticMarkup(React.createElement(section.LifeHighlightsSection, { records }));
    assert.equal((html.match(/<li/g) ?? []).length, count);
    assert.doesNotMatch(html, /콘텐츠 준비 중/);
    assert.match(html, /href="\/life\/record-0"/);
  }
});


test("대표 카드 1·2·3·9건은 양방향 순환하며 세로 조작과 짧은 드래그는 제외한다", async () => {
  const { nextHighlight, highlightSwipe } = await import("./life-highlight-navigation");
  for (const count of [1, 2, 3, 9]) {
    let index = 0;
    assert.equal(nextHighlight(index, -1, count), count - 1);
    for (let i = 0; i < count * 10; i++) index = nextHighlight(index, 1, count);
    assert.equal(index, 0);
    for (let i = 0; i < count * 10; i++) index = nextHighlight(index, -1, count);
    assert.equal(index, 0);
  }
  assert.equal(nextHighlight(3, 1, 0), 0);
  assert.equal(highlightSwipe(-80, 10), 1);
  assert.equal(highlightSwipe(80, 10), -1);
  assert.equal(highlightSwipe(25, 0), 0);
  assert.equal(highlightSwipe(60, 80), 0);
});
