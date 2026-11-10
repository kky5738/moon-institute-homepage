import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { inspectHomeIntroductionImage } from "./home-introduction-image";
import { validateHomeIntroductionInput } from "./home-introduction-validation";
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
