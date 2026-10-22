import assert from "node:assert/strict";
import test from "node:test";
import { AttachmentKind } from "@/generated/prisma/enums";
import { getPublicPostAttachmentWhere } from "@/lib/public-post-attachments";

test("공개 파일 조회는 확정·업로드 완료·미삭제 첨부만 허용한다", () => {
  assert.deepEqual(getPublicPostAttachmentWhere(), {
    committedAt: { not: null },
    uploadedAt: { not: null },
    deletedAt: null,
  });
});

test("공개 첨부 수는 확정된 문서 파일만 센다", () => {
  assert.deepEqual(
    getPublicPostAttachmentWhere(AttachmentKind.ATTACHMENT),
    {
      kind: AttachmentKind.ATTACHMENT,
      committedAt: { not: null },
      uploadedAt: { not: null },
      deletedAt: null,
    },
  );
});
