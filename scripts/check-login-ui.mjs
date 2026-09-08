// Run against the isolated local server described in READY-30, never Production.
// PLAYWRIGHT_MODULE may point to the desktop bundled playwright installation.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  let submissions = 0;
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== "localhost" || url.port !== "3100") return route.abort();
    if (route.request().method() === "POST") {
      submissions++;
      await new Promise(resolve => setTimeout(resolve, 5500));
    }
    await route.continue();
  });
  await page.goto("http://localhost:3100/login");
  await page.getByLabel("아이디 또는 이메일", { exact: true }).fill("local-admin");
  await page.getByLabel("비밀번호", { exact: true }).fill("wrong-local-password");
  const submit = page.getByRole("button", { name: "로그인", exact: true });
  const before = await submit.boundingBox();
  await page.evaluate(() => {
    const form = document.querySelector("form");
    form.addEventListener("submit", () => {
      const started = performance.now();
      const observer = new MutationObserver(() => {
        if (form.querySelector("button[aria-busy=true]")) {
          window.loginFeedbackMs = performance.now() - started;
          observer.disconnect();
        }
      });
      observer.observe(form, { subtree: true, attributes: true });
    }, { once: true });
  });
  await submit.click();
  const pending = page.getByRole("button", { name: "로그인 중…", exact: true });
  await pending.waitFor();
  assert.equal(await pending.isDisabled(), true);
  assert.equal(await pending.getAttribute("aria-busy"), "true");
  const feedbackMs = await page.evaluate(() => window.loginFeedbackMs);
  assert.ok(feedbackMs < 100, `Pending feedback took ${feedbackMs}ms`);
  await page.getByLabel("비밀번호", { exact: true }).press("Enter");
  assert.equal(await pending.locator("span").first().evaluate(el => getComputedStyle(el).animationName), "none");
  const during = await pending.boundingBox();
  assert.equal(before.width, during.width);
  assert.equal(before.height, during.height);
  await page.getByRole("status").filter({ hasText: "로그인 확인이 지연되고 있습니다" }).waitFor();
  await page.screenshot({ path: "/tmp/moon-login-pending.png", fullPage: true });
  await page.waitForURL("**/login?error=CredentialsSignin", { timeout: 30000 });
  assert.equal(submissions, 1);
  assert.equal(await submit.isEnabled(), true);
  assert.match(await page.locator("#login-error").innerText(), /비밀번호를 확인/);
  assert.equal(await page.getByText("로그인 확인이 지연되고 있습니다", { exact: false }).count(), 0);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "/tmp/moon-login-error-desktop.png", fullPage: true });
  console.log({ feedbackMs, submissions });
  console.log("PASS: mobile pending, delayed notice, Enter deduplication, reduced motion, stable button and retry after failure");
} finally {
  await browser.close();
}
