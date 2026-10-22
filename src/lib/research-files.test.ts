import assert from "node:assert/strict";
import test from "node:test";
import {
  createResearchImageMarker,
  getResearchExistingAttachmentIds,
  getResearchUploadPlan,
  getResearchImageIds,
  hasValidImageSignature,
  MAX_RESEARCH_FILE_SIZE,
  replaceResearchImageMarker,
  resetResearchUploadForRetry,
  splitResearchContent,
  validateResearchUpload,
} from "@/lib/research-files";

const id = "123e4567-e89b-42d3-a456-426614174000";

test("부분 업로드 재시도는 완료 파일을 보존하고 다시 올리지 않는다", () => {
  const plan = getResearchUploadPlan(
    [
      { id: "uploaded-a", kind: "ATTACHMENT", uploaded: true },
      { id: "pending-b", kind: "ATTACHMENT" },
      { id: "unused-image", kind: "INLINE_IMAGE", uploaded: true },
    ],
    new Set(),
    ["existing-file"],
  );

  assert.deepEqual(plan.uploads, [{ id: "pending-b", kind: "ATTACHMENT" }]);
  assert.deepEqual([...plan.attachmentIds], [
    "existing-file",
    "uploaded-a",
    "pending-b",
  ]);
});

test("재진입한 미확정 첨부는 명시적으로 선택한 것만 저장 목록에 넣는다", () => {
  const files = [
    { id: "committed", kind: "ATTACHMENT" as const, committed: true },
    { id: "recovered-document", kind: "ATTACHMENT" as const, committed: false },
    { id: "unselected-document", kind: "ATTACHMENT" as const, committed: false },
    { id: "recovered-image", kind: "INLINE_IMAGE" as const, committed: false },
    { id: "image-without-marker", kind: "INLINE_IMAGE" as const, committed: false },
  ];

  assert.deepEqual(
    getResearchExistingAttachmentIds(
      files,
      new Set(["recovered-document", "recovered-image", "image-without-marker"]),
      new Set(["recovered-image"]),
    ),
    ["committed", "recovered-document", "recovered-image"],
  );
});

test("실패 파일의 재시도 ID와 본문 이미지 표식을 함께 갱신한다", () => {
  const nextId = "123e4567-e89b-42d3-b456-426614174001";
  const otherId = "123e4567-e89b-42d3-a456-426614174002";
  const file = { id, kind: "INLINE_IMAGE" as const, uploaded: true, file: {} };
  const otherFile = { id: otherId, kind: "ATTACHMENT" as const, uploaded: true };
  const content = [
    "앞 문단",
    createResearchImageMarker(id),
    createResearchImageMarker(otherId),
    "뒤 문단",
  ].join("\n");

  assert.deepEqual(resetResearchUploadForRetry([file, otherFile], id, nextId), [
    { ...file, id: nextId, uploaded: false },
    otherFile,
  ]);
  assert.equal(
    replaceResearchImageMarker(content, id, nextId),
    [
      "앞 문단",
      createResearchImageMarker(nextId),
      createResearchImageMarker(otherId),
      "뒤 문단",
    ].join("\n"),
  );
});

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
