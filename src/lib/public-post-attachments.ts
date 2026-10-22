import type { Prisma } from "@/generated/prisma/client";
import { AttachmentKind } from "@/generated/prisma/enums";

export function getPublicPostAttachmentWhere(
  kind?: AttachmentKind,
): Prisma.PostAttachmentWhereInput {
  return {
    ...(kind ? { kind } : {}),
    committedAt: { not: null },
    uploadedAt: { not: null },
    deletedAt: null,
  };
}
