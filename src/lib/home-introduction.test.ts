import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { inspectHomeIntroductionImage } from "./home-introduction-image";
import { validateHomeIntroductionInput, validateStoredHomeIntroduction } from "./home-introduction-validation";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const valid = { contentType: "image/jpeg", size: 100, message: "문구", altText: "설명" };

test("문구·대체 텍스트·MIME·빈 파일·20MiB 경계를 검사하고 일반 텍스트를 보존한다", () => {
  assert.equal(validateHomeIntroductionInput({ ...valid, message: " <b>원문</b> " }).message, "<b>원문</b>");
  assert.equal(validateHomeIntroductionInput({ ...valid, size: 20 * 1024 * 1024, message: "가".repeat(200), altText: "나".repeat(200) }).size, 20971520);
  for (const bad of [{ contentType: "image/svg+xml" }, { contentType: "toString" }, { size: 0 }, { size: -1 }, { size: 1.5 }, { size: 20971521 }, { message: " " }, { message: "가".repeat(201) }, { altText: "" }, { altText: "나".repeat(201) }]) {
    assert.throws(() => validateHomeIntroductionInput({ ...valid, ...bad }));
  }
});

test("실제 JPEG·PNG·WebP를 디코딩하고 EXIF 표시 방향의 치수를 얻는다", async () => {
  for (const format of ["jpeg", "png", "webp"] as const) {
    const bytes = await sharp({ create: { width: 40, height: 20, channels: 3, background: "white" } }).toFormat(format).toBuffer();
    assert.deepEqual(await inspectHomeIntroductionImage(bytes, `image/${format}`), { imageWidth: 40, imageHeight: 20 });
    await assert.rejects(inspectHomeIntroductionImage(bytes.subarray(0, 14), `image/${format}`));
    await assert.rejects(inspectHomeIntroductionImage(bytes, format === "png" ? "image/jpeg" : "image/png"));
  }
  for (const orientation of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const bytes = await sharp({ create: { width: 40, height: 20, channels: 3, background: "white" } }).jpeg().withMetadata({ orientation }).toBuffer();
    assert.deepEqual(await inspectHomeIntroductionImage(bytes, "image/jpeg"), { imageWidth: orientation >= 5 ? 20 : 40, imageHeight: orientation >= 5 ? 40 : 20 });
  }
  await assert.rejects(inspectHomeIntroductionImage(new Uint8Array(), "image/jpeg"));
  const wide = await sharp({ create: { width: 20001, height: 1, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(inspectHomeIntroductionImage(wide, "image/png"));
});

test("브라우저 파일 읽기는 표시 치수와 URL을 돌려주고 실패 시 URL을 해제한다", async () => {
  const revoked: string[] = [];
  let fails = false;
  class MockImage {
    naturalWidth = 20; naturalHeight = 40;
    async decode() { if (fails) throw new Error("decode"); }
  }
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync("src/lib/home-introduction-file.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, Image: MockImage, URL: { createObjectURL: () => "blob:test", revokeObjectURL: (url: string) => revoked.push(url) }, require: () => ({ validateHomeIntroductionInput }) });
  const reader = exports as typeof import("./home-introduction-file");
  const file = new File(["image"], "test.jpeg", { type: "image/jpeg" });
  const result = await reader.readHomeIntroductionFile(file);
  assert.equal(result.imageWidth, 20);
  assert.equal(result.imageHeight, 40);
  assert.equal(revoked.length, 0);
  fails = true;
  await assert.rejects(reader.readHomeIntroductionFile(file));
  assert.deepEqual(revoked, ["blob:test"]);
});

test("Storage 검증은 서버의 MIME·크기와 다운로드 바이트 수를 다시 확인한다", async () => {
  let info = { size: 3, contentType: "image/jpeg" };
  let blob = new Blob([new Uint8Array(3)]);
  let fail = false;
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync("src/lib/supabase-storage.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, Headers, fetch, Uint8Array, process: { env: {} }, require(name: string) {
    if (name === "server-only") return {};
    if (name === "@/lib/env") return { getRequiredEnv: () => "test" };
    if (name === "@/lib/research-files") return { MAX_RESEARCH_FILE_SIZE: 20971520 };
    if (name === "@supabase/supabase-js") return { createClient: () => ({ storage: { from: () => ({
      async info() { return { data: info, error: fail ? new Error("network") : null }; },
      async download() { return { data: blob, error: fail ? new Error("network") : null }; },
    }) } }) };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  const storage = exports as typeof import("./supabase-storage");
  const expected = { size: 3, contentType: "image/jpeg" };
  assert.equal((await storage.downloadHomeIntroductionImage("home-introduction/test.jpg", expected)).length, 3);
  info = { size: 4, contentType: "image/jpeg" };
  await assert.rejects(storage.downloadHomeIntroductionImage("path", expected));
  info = { size: 3, contentType: "text/plain" };
  await assert.rejects(storage.downloadHomeIntroductionImage("path", expected));
  info = { size: 3, contentType: "image/jpeg" }; blob = new Blob([new Uint8Array(2)]);
  await assert.rejects(storage.downloadHomeIntroductionImage("path", expected));
  fail = true;
  await assert.rejects(storage.downloadHomeIntroductionImage("path", expected));
});

test("저장된 콘텐츠는 완료된 이미지 경로·치수와 기본 콘텐츠 식별자를 확인한다", async () => {
  const { validateStoredHomeIntroduction, DEFAULT_HOME_INTRODUCTION_ID } = await import("./home-introduction-validation");
  const id = "11111111-1111-4111-8111-111111111111";
  const content = { ...valid, id, objectPath: `home-introduction/${id}.jpg`, localAsset: null, imageWidth: 100, imageHeight: 200 };
  assert.doesNotThrow(() => validateStoredHomeIntroduction(content));
  assert.doesNotThrow(() => validateStoredHomeIntroduction({ ...content, id: DEFAULT_HOME_INTRODUCTION_ID, objectPath: null, localAsset: "home-introduction.jpeg" }));
  for (const invalid of [{ objectPath: null }, { objectPath: "research/1/private.jpg" }, { localAsset: "home-introduction.jpeg" }, { imageWidth: 0 }, { imageHeight: 20001 }, { imageWidth: 10000, imageHeight: 10000 }]) {
    assert.throws(() => validateStoredHomeIntroduction({ ...content, ...invalid }));
  }
});

test("표시용 WebP는 방향·전체 영역·투명도를 보존하고 1920px 이하로만 축소한다", async () => {
  const { createHomeIntroductionDisplay } = await import("./home-introduction-image");
  for (const [width, height] of [[4000, 2000], [2000, 4000], [2500, 2500], [31, 17]]) {
    const original = await sharp({ create: { width, height, channels: 4, background: { r: 90, g: 120, b: 150, alpha: 0.5 } } }).png().toBuffer();
    const display = await createHomeIntroductionDisplay(original, "image/png");
    const meta = await sharp(display.bytes).metadata();
    const scale = Math.min(1, 1920 / Math.max(width, height));
    assert.equal(meta.format, "webp"); assert.equal(meta.width, Math.round(width * scale)); assert.equal(meta.height, Math.round(height * scale));
    assert.equal(display.displaySize, display.bytes.length); assert.equal(meta.hasAlpha, true);
    const decoded = await sharp(display.bytes).raw().toBuffer();
    assert.ok(Math.abs(decoded[3] - 128) <= 1);
    assert.ok(Math.abs(decoded[0] - 90) <= 5);
    assert.deepEqual([display.imageWidth, display.imageHeight], [width, height]);
  }
  const pattern = await sharp({ create: { width: 120, height: 80, channels: 3, background: "red" } }).composite([
    { input: await sharp({ create: { width: 60, height: 40, channels: 3, background: "blue" } }).png().toBuffer(), left: 60, top: 40 },
  ]).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const display = await createHomeIntroductionDisplay(pattern, "image/jpeg");
  assert.deepEqual([display.displayWidth, display.displayHeight], [80, 120]);
  assert.equal((await sharp(display.bytes).metadata()).orientation, undefined);
  const pixel = await sharp(display.bytes).extract({ left: 5, top: 100, width: 1, height: 1 }).raw().toBuffer();
  assert.ok(pixel[2] > 220 && pixel[0] < 30, "rotated lower-left corner must retain blue source corner");
  await assert.rejects(createHomeIntroductionDisplay(new Uint8Array([255, 216, 255]), "image/jpeg"));
});

test("표시용 메타데이터는 전부 없거나 검증된 경로·형식·크기·치수 묶음이어야 한다", () => {
  const content = { id: "11111111-1111-4111-8111-111111111111", objectPath: "home-introduction/11111111-1111-4111-8111-111111111111.jpg", localAsset: null,
    contentType: "image/jpeg", size: 1000, imageWidth: 4000, imageHeight: 2000, message: "문구", altText: "설명" };
  const display = { displayObjectPath: "home-introduction/11111111-1111-4111-8111-111111111111-display.webp", displayContentType: "image/webp", displaySize: 100, displayWidth: 1920, displayHeight: 960 };
  assert.doesNotThrow(() => validateStoredHomeIntroduction({ ...content, ...display }));
  for (const invalid of [{ displaySize: null }, { displayObjectPath: "other.webp" }, { displayContentType: "image/jpeg" }, { displayWidth: 1921 }, { displayHeight: 0 }]) {
    assert.throws(() => validateStoredHomeIntroduction({ ...content, ...display, ...invalid }));
  }
});
