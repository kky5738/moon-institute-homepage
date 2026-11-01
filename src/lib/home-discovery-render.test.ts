import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as topics from "@/lib/topics";

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

test("표시 값에 따라 메뉴와 주제 영상 링크가 함께 변경된다", async () => {
  const jsx = await import("react/jsx-runtime");
  const link = { default: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement("a", { href }, children) };
  const box = ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children);
  const shared = {
    "react/jsx-runtime": jsx, "next/link": link,
    "next/image": { default: () => null },
    "@/components/ui/badge": { Badge: box },
    "@/components/ui/card": { Card: box },
    "@/components/ui/button": { Button: box, buttonVariants: () => "" },
  };
  for (const enabled of [false, true]) {
    const deps = { ...shared, "@/lib/home-discovery": { homeDiscoveryEnabled: enabled } };
    const navbar = load<typeof import("@/components/site/SiteNavbar")>("src/components/site/SiteNavbar.tsx", { ...deps,
      react: React, "next/navigation": { usePathname: () => "/topics" },
      "@/lib/home-navigation": { isBeforeHome: () => false, isOnManifesto: () => false },
      "@/lib/user-auth": { getAuthNavigation: () => ({ href: "/login", label: "로그인" }) },
    });
    const footer = load<typeof import("@/components/site/SiteFooter")>("src/components/site/SiteFooter.tsx", { ...deps,
      "next/cache": { cacheLife: () => {} },
    });
    const card = load<typeof import("@/components/topics/TopicIndexCard")>("src/components/topics/TopicIndexCard.tsx", deps);
    const detail = load<typeof import("@/app/topics/[slug]/page")>("src/app/topics/[slug]/page.tsx", { ...deps,
      "next/navigation": { notFound: () => { throw new Error("404"); } },
      "@/components/topics/TopicPostList": { TopicPostList: () => null },
      "@/lib/topic-posts": { getTopicRelatedPosts: async () => ({ notices: [], materials: [] }) },
      "@/lib/topics": topics,
    });
    const navHtml = renderToStaticMarkup(React.createElement(navbar.SiteNavbar, { role: null }));
    const footerHtml = renderToStaticMarkup(await footer.SiteFooter());
    const cardHtml = renderToStaticMarkup(React.createElement(card.TopicIndexCard, { topic: topics.researchTopics[1], index: 1 }));
    const detailHtml = renderToStaticMarkup(await detail.default({ params: Promise.resolve({ slug: "words" }) }));
    for (const html of [navHtml, footerHtml]) {
      assert.equal(html.includes('href="/topics"'), enabled);
      assert.equal(html.includes('href="/materials"'), enabled);
      assert.match(html, /href="\/research"/);
    }
    assert.match(footerHtml, enabled ? />자료<\/h2>/ : />안내<\/h2>/);
    for (const html of [cardHtml, detailHtml]) {
      assert.equal(html.includes('href="/#media"'), enabled);
      assert.match(html, /href="\/materials"/);
    }
    assert.match(detailHtml, /말씀 해설 영상 안내/);
  }
});
