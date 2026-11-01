import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import { renderToReadableStream } from "react-dom/server";
import ts from "typescript";
import * as enums from "@/generated/prisma/enums";
import * as guides from "@/lib/material-guides";

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

test("홈 탐색 영역 비활성화는 조회하지 않고 재활성화는 자료와 빈 상태를 복원한다", async () => {
  const jsx = await import("react/jsx-runtime");
  const box = ({ children }: { children: React.ReactNode }) => React.createElement("span", null, children);
  const link = { default: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement("a", { href }, children) };
  const material = load<typeof import("@/components/home/MaterialReadingPathSection")>("src/components/home/MaterialReadingPathSection.tsx", {
    "react/jsx-runtime": jsx, "next/link": link, "@/components/ui/badge": { Badge: box },
    "@/components/ui/button": { buttonVariants: () => "" },
  });
  for (const [enabled, withMaterial] of [[false, false], [true, false], [true, true]]) {
    const calls: Array<{ type: string; slugs: string[]; take: number }> = [];
    const discovery = load<typeof import("@/components/home/HomeDiscoverySections")>("src/components/home/HomeDiscoverySections.tsx", {
      "react/jsx-runtime": jsx, "@/generated/prisma/enums": enums, "@/lib/material-guides": guides,
      "@/lib/posts": { getPublishedPostPreview: async (type: string, options: { slugs: string[]; take: number }) => {
        calls.push({ type, ...options });
        return withMaterial ? [{ id: 1, slug: "life-research-material-guide", title: "표본 입문 자료" }] : [];
      } },
      "@/components/home/ResearchTopicHubSection": { ResearchTopicHubSection: () => React.createElement("section", { id: "topics" }) },
      "@/components/home/VideoContentSection": { VideoContentSection: () => React.createElement("section", { id: "media" }) },
      "@/components/home/MaterialReadingPathSection": material,
    });
    const landing = load<typeof import("@/components/home/HomeLandingSections")>("src/components/home/HomeLandingSections.tsx", {
      "react/jsx-runtime": jsx, "node:fs": { readFileSync: () => "" },
      "@/lib/home-discovery": { homeDiscoveryEnabled: enabled }, "@/lib/life-events": { parseLifeEventsCsv: () => [] },
      "@/components/home/HomeDiscoverySections": discovery,
      "@/components/home/HomeHeroSection": { HomeHeroSection: () => React.createElement("div", { id: "hero" }) },
      "@/components/home/LifeTimelineSection": { LifeTimelineSection: () => null },
      "@/components/home/LifeTimelineEventList": { LifeTimelineEventList: () => null },
      "@/components/home/ParticipationCtaSection": { ParticipationCtaSection: () => React.createElement("div", { id: "contact" }) },
    });
    const stream = await renderToReadableStream(React.createElement(landing.HomeLandingSections));
    const html = await new Response(stream).text();
    assert.equal(calls.length, enabled ? 1 : 0);
    assert.match(html, /id="life-timeline"/);
    assert.match(html, /id="contact"/);
    if (enabled) {
      assert.equal(calls[0].type, enums.PostType.PROMOTION);
      assert.equal(calls[0].take, 3);
      assert.equal(JSON.stringify(calls[0].slugs), JSON.stringify(guides.materialGuideSlugs));
      assert.ok(html.indexOf('id="life-timeline"') < html.indexOf('id="topics"'));
      assert.ok(html.indexOf('id="topics"') < html.indexOf('id="media"'));
      assert.ok(html.indexOf('id="media"') < html.indexOf('id="materials"'));
      assert.ok(html.indexOf('id="materials"') < html.indexOf('id="contact"'));
      assert.match(html, withMaterial ? /표본 입문 자료/ : /등록된 입문 자료가 없습니다/);
    } else {
      assert.doesNotMatch(html, /id="(?:topics|media|materials)"/);
    }
  }
});
