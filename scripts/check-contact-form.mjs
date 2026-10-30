// Run only against the isolated READY-38 test server and its DB failure fixture.
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const page = await browser.newPage();
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "localhost" || url.port !== "33438") return route.abort();
    await route.continue();
  });
  await page.goto("http://localhost:33438/contact");
  const fields = {
    type: page.locator("#type"),
    name: page.locator("#name"),
    email: page.locator("#email"),
    phone: page.locator("#phone"),
    subject: page.locator("#subject"),
    message: page.locator("#message"),
  };
  const values = { type: "PARTICIPATION", name: "테스트 이름", email: "", phone: "", subject: "테스트 제목", message: "테스트 문의 본문입니다." };
  const check = async () => {
    for (const [key, value] of Object.entries(values)) assert.equal(await fields[key].inputValue(), value, key);
  };
  await fields.type.selectOption(values.type);
  for (const key of ["name", "subject", "message"]) await fields[key].fill(values[key]);
  const submit = page.getByRole("button", { name: "문의 접수", exact: true });
  await submit.click();
  await page.getByRole("alert").filter({ hasText: "이메일 또는 연락처" }).waitFor();
  await check();

  values.email = "test@example.com";
  values.phone = "010-1234-5678";
  values.name = "  ";
  await fields.email.fill(values.email);
  await fields.phone.fill(values.phone);
  await fields.name.fill(values.name);
  await submit.click();
  await page.getByRole("alert").filter({ hasText: "이름은 2자 이상" }).waitFor();
  await check();

  values.name = "DB_FAILURE";
  await fields.name.fill(values.name);
  await submit.click();
  await page.getByRole("alert").filter({ hasText: "문의 접수 중 문제가 발생했습니다" }).waitFor();
  await check();

  values.name = "재시도 이름";
  await fields.name.fill(values.name);
  await submit.click();
  await page.getByRole("status").filter({ hasText: "문의가 접수되었습니다" }).waitFor();
  for (const [key, field] of Object.entries(fields)) {
    assert.equal(await field.inputValue(), key === "type" ? "GENERAL" : "", key);
  }
  console.log("PASS: validation and DB errors preserve all fields; retry succeeds and resets them");
} finally {
  await browser.close();
}
