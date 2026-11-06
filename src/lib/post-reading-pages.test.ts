import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createReadingFixture, hiddenSummary } from "../../tests/helpers/post-reading-fixture";
import { AttachmentKind } from "@/generated/prisma/enums";
import type { PostDocument } from "@/components/posts/PostDocument";

const routes = ["research", "notices", "materials", "account/posts", "admin/posts", "research/[slug]", "notices/[slug]", "materials/[slug]"];

test("모든 게시글 목록·상세는 기존 요약을 숨기고 메타데이터 설명은 보존한다", async () => {
  const fixture = createReadingFixture();
  for (const route of routes) {
    const html = await fixture.render(route);
    assert.doesNotMatch(html, new RegExp(hiddenSummary), route);
    assert.match(html, /검증용 긴 제목/, route);
    if (route.endsWith("[slug]")) {
      assert.match(html, /다운로드/);
      assert.match(html, /PDF · 2KB/);
      const page = fixture.load<{ generateMetadata: (props: object) => Promise<{ description: string }> }>(`src/app/${route}/page.tsx`);
      assert.equal((await page.generateMetadata({ params: Promise.resolve({ slug: fixture.post.slug }) })).description, hiddenSummary);
    }
  }
  for (const summary of ["", "본문을 잘라 만든 대체 요약"]) {
    fixture.post.summary = summary;
    for (const route of routes) assert.doesNotMatch(await fixture.render(route), /본문을 잘라 만든 대체 요약/);
  }
});

test("문서 상세는 본문·첨부·별도 해설 순서와 파일 없는 상태를 처리한다", async () => {
  const fixture = createReadingFixture();
  const html = await fixture.render("materials/[slug]");
  assert.ok(html.indexOf("검증용 본문") < html.indexOf("첨부파일"));
  assert.ok(html.indexOf("첨부파일") < html.indexOf("자료 해설"));
  assert.match(html, /해설 요약/);
  assert.match(html, /읽기 포인트/);
  assert.doesNotMatch(html, /<script>실행 금지/);
  fixture.post.attachments = [];
  assert.doesNotMatch(await fixture.render("notices/[slug]"), /id="attachments-title"/);
  const document = fixture.load<{ PostDocument: typeof PostDocument }>("src/components/posts/PostDocument.tsx");
  fixture.post.attachments = [{ id: "missing", kind: AttachmentKind.ATTACHMENT, originalName: "missing.docx", contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1024, url: null, altText: null, imageWidth: null, imageHeight: null }];
  const missing = renderToStaticMarkup(document.PostDocument({ post: fixture.post, backHref: "/research", backLabel: "연구", children: "본문" }));
  assert.match(missing, /DOCX · 1KB/);
  assert.match(missing, /다운로드할 수 없습니다/);
  fixture.rows.length = 0;
  for (const route of ["research/[slug]", "notices/[slug]", "materials/[slug]"]) await assert.rejects(fixture.render(route), /404/);
});


test("본문 이미지와 관련 자료는 요약 노출 없이 기존 안전한 렌더링을 유지한다", async () => {
  const fixture = createReadingFixture();
  const imageId = "dc34e114-f0ee-4a76-94a8-51460959a395";
  fixture.post.content = `앞 문단\n[[research-image:${imageId}]]\n뒤 문단`;
  fixture.post.attachments.push({ id: imageId, kind: AttachmentKind.INLINE_IMAGE, originalName: "image.png", contentType: "image/png", size: 100, url: "/image.png", altText: "검증 이미지", imageWidth: 320, imageHeight: 160 });
  const html = await fixture.render("research/[slug]");
  assert.match(html, /alt="검증 이미지"/);
  assert.match(html, /width="320" height="160"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /max-w-full/);
  assert.ok(html.indexOf("앞 문단") < html.indexOf('alt="검증 이미지"'));
  assert.ok(html.indexOf('alt="검증 이미지"') < html.indexOf("뒤 문단"));
  fixture.post.attachments.pop();
  assert.match(await fixture.render("research/[slug]"), /본문 이미지를 불러올 수 없습니다/);
  const related = fixture.load<{ RecommendedMaterialList: (props: { posts: typeof fixture.rows }) => React.ReactNode }>("src/components/materials/RecommendedMaterialList.tsx");
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(related.RecommendedMaterialList, { posts: fixture.rows })), new RegExp(hiddenSummary));
});
