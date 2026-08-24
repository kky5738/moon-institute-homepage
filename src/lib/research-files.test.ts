import assert from "node:assert/strict";
import test from "node:test";
import {
  createResearchImageMarker,
  getResearchImageIds,
  hasValidImageSignature,
  MAX_RESEARCH_FILE_SIZE,
  splitResearchContent,
  validateResearchUpload,
} from "@/lib/research-files";

const id = "123e4567-e89b-42d3-a456-426614174000";

test("문서 형식과 파일당 20MiB 경계를 검사한다", () => {
  assert.equal(
    validateResearchUpload({
      id,
      kind: "ATTACHMENT",
      name: "연구자료.pdf",
      size: MAX_RESEARCH_FILE_SIZE,
      contentType: "application/pdf",
    }).extension,
    "pdf",
  );
  assert.throws(() =>
    validateResearchUpload({
      id,
      kind: "ATTACHMENT",
      name: "연구자료.pdf.exe",
      size: 1,
      contentType: "application/pdf",
    }),
  );
  assert.throws(() =>
    validateResearchUpload({
      id,
      kind: "ATTACHMENT",
      name: "연구자료.docx",
      size: MAX_RESEARCH_FILE_SIZE + 1,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
  );
});

test("본문 이미지 표식만 분리하고 이미지 ID를 추출한다", () => {
  const marker = createResearchImageMarker(id);
  const content = `앞 문단\n${marker}\n뒤 문단`;

  assert.deepEqual(getResearchImageIds(content), [id]);
  assert.deepEqual(splitResearchContent(content), [
    { type: "text", value: "앞 문단\n" },
    { type: "image", id },
    { type: "text", value: "\n뒤 문단" },
  ]);
});

test("JPEG, PNG, WebP 실제 시그니처를 확인한다", () => {
  assert.equal(
    hasValidImageSignature("image/jpeg", Uint8Array.of(0xff, 0xd8, 0xff)),
    true,
  );
  assert.equal(
    hasValidImageSignature(
      "image/png",
      Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
    ),
    true,
  );
  assert.equal(
    hasValidImageSignature(
      "image/webp",
      Uint8Array.from(Buffer.from("RIFF0000WEBP")),
    ),
    true,
  );
  assert.equal(hasValidImageSignature("image/png", Uint8Array.of(1, 2, 3)), false);
});
