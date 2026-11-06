import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as topics from "@/lib/topics";

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


test("도입부·선언문 높이 변화는 스크롤 없이 메뉴 경계를 다시 계산하고 관찰을 정리한다", async () => {
  const effects: Array<() => () => void> = [];
  const states: boolean[] = [];
  const elements = { "home-introduction": {}, "founding-manifesto": { getBoundingClientRect: () => ({ top: -100 }) }, "home-content": { getBoundingClientRect: () => ({ top: homeTop }) } };
  let homeTop = 100;
  let stateIndex = 0;
  let onResize: (() => void) | undefined;
  let disconnected = false;
  const observed: unknown[] = [];
  const box = ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children);
  const navbar = load<typeof import("@/components/site/SiteNavbar")>("src/components/site/SiteNavbar.tsx", {
    "react/jsx-runtime": await import("react/jsx-runtime"),
    react: { useEffect: (effect: () => () => void) => effects.push(effect), useRef: () => ({ current: { getBoundingClientRect: () => ({ bottom: 64 }) } }),
      useState: (initial: boolean) => { const index = stateIndex++; states[index] = initial; return [initial, (value: boolean) => { states[index] = value; }]; } },
    "next/navigation": { usePathname: () => "/" },
    "next/link": { default: box }, "next/image": { default: () => null },
    "@/components/ui/button": { Button: box, buttonVariants: () => "" },
    "@/lib/home-navigation": await import("@/lib/home-navigation"),
    "@/lib/home-discovery": { homeDiscoveryEnabled: false },
    "@/lib/user-auth": { getAuthNavigation: () => ({ href: "/login", label: "로그인" }) },
  }, {
    window: { scrollY: 0, addEventListener() {}, removeEventListener() {} },
    document: { getElementById: (id: keyof typeof elements) => elements[id] },
    ResizeObserver: class { constructor(callback: () => void) { onResize = callback; } observe(element: unknown) { observed.push(element); } disconnect() { disconnected = true; } },
  });
  renderToStaticMarkup(React.createElement(navbar.SiteNavbar, { role: null }));
  const cleanup = effects[0]();
  assert.deepEqual(observed, [elements["home-introduction"], elements["founding-manifesto"]]);
  assert.equal(states[2], true);
  assert.equal(states[3], true);
  homeTop = 64;
  onResize?.();
  assert.equal(states[2], false);
  assert.equal(states[3], false);
  homeTop = 200;
  onResize?.();
  assert.equal(states[2], true);
  assert.equal(states[3], true);
  cleanup();
  assert.equal(disconnected, true);
});
