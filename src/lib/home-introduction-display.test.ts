import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import sharp from "sharp";
import ts from "typescript";
import * as researchFiles from "./research-files";

test("검증된 표시용 읽기는 info 없이 한 번 다운로드하고 응답 형식·바이트를 검사한다", async () => {
  const bytes = await sharp({ create: { width: 40, height: 20, channels: 3, background: "white" } }).webp().toBuffer();
  let blob: Blob | null = new Blob([new Uint8Array(bytes)], { type: "image/webp" });
  let failed = false;
  let downloads = 0;
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync("src/lib/supabase-storage.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, Uint8Array, process: { env: {} }, require(name: string) {
    if (name === "server-only") return {};
    if (name === "@/lib/env") return { getRequiredEnv: () => "test" };
    if (name === "@/lib/research-files") return researchFiles;
    if (name === "@supabase/supabase-js") return { createClient: () => ({ storage: { from: () => ({
      info() { assert.fail("display reads must not fetch Storage info"); },
      async download() { downloads++; return { data: blob, error: failed ? new Error("private secret URL") : null }; },
    }) } }) };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  const storage = exports as typeof import("./supabase-storage");
  const expected = { contentType: "image/webp", size: bytes.length };
  assert.deepEqual(Buffer.from(await storage.downloadHomeIntroductionDisplay("verified-display.webp", expected)), bytes);
  assert.equal(downloads, 1);
  for (const invalid of [{ contentType: "image/jpeg" }, { size: 0 }, { size: 20971521 }, { size: 1.5 }]) {
    await assert.rejects(storage.downloadHomeIntroductionDisplay("path", { ...expected, ...invalid }));
  }
  assert.equal(downloads, 1);
  blob = new Blob([new Uint8Array(bytes)], { type: "image/png" });
  await assert.rejects(storage.downloadHomeIntroductionDisplay("path", expected));
  blob = new Blob([new Uint8Array(bytes.subarray(0, -1))], { type: "image/webp" });
  await assert.rejects(storage.downloadHomeIntroductionDisplay("path", expected));
  blob = new Blob([new Uint8Array(bytes.length)], { type: "image/webp" });
  await assert.rejects(storage.downloadHomeIntroductionDisplay("path", expected));
  blob = null;
  await assert.rejects(storage.downloadHomeIntroductionDisplay("path", expected));
  failed = true;
  await assert.rejects(storage.downloadHomeIntroductionDisplay("path", expected), (error: Error) => {
    assert.doesNotMatch(error.message, /secret|private|URL/); return true;
  });
});
