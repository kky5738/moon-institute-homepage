import { AttachmentKind, PostStatus, PostType } from "@/generated/prisma/enums";
import type { PrismaClient } from "@/generated/prisma/client";

export function canEditResearchPost(
  userId: number | null,
  authorId: number | null,
) {
  return userId !== null && userId === authorId;
}

type ResearchPostSaveDatabase = Pick<PrismaClient, "$transaction">;

type ResearchPostSaveInput = {
  postId: number;
  authorId: number;
  title: string;
  summary: string | null;
  content: string;
  status: PostStatus;
  publishedAt: Date | null;
  imageIds: string[];
  attachmentIds: string[];
  removedIds: string[];
};

export async function saveResearchPostAtomically(
  database: ResearchPostSaveDatabase,
  input: ResearchPostSaveInput,
) {
  await database.$transaction(async (transaction) => {
    const attachments = await transaction.postAttachment.findMany({
      where: {
        id: { in: input.attachmentIds },
        postId: input.postId,
        uploadedAt: { not: null },
        deletedAt: null,
        post: {
          authorId: input.authorId,
          type: PostType.RESEARCH,
          deletedAt: null,
        },
      },
      select: { id: true, kind: true, committedAt: true },
    });

    if (
      attachments.length !== input.attachmentIds.length ||
      input.imageIds.some(
        (id) =>
          !input.attachmentIds.includes(id) ||
          !attachments.some(
            (attachment) =>
              attachment.id === id && attachment.kind === AttachmentKind.INLINE_IMAGE,
          ),
      )
    ) {
      throw new Error("저장할 첨부 또는 본문 이미지가 유효하지 않습니다.");
    }

    const { count: committedCount } = await transaction.postAttachment.updateMany({
      where: {
        id: { in: input.attachmentIds },
        postId: input.postId,
        committedAt: null,
        uploadedAt: { not: null },
        deletedAt: null,
      },
      data: { committedAt: new Date() },
    });
    if (
      committedCount !==
      attachments.filter((attachment) => !attachment.committedAt).length
    ) {
      throw new Error(
        "첨부 상태가 변경되었습니다. 게시글을 새로고침한 뒤 다시 저장해주세요.",
      );
    }

    await transaction.postAttachment.updateMany({
      where: {
        postId: input.postId,
        deletedAt: null,
        OR: [
          { id: { in: input.removedIds } },
          { kind: AttachmentKind.INLINE_IMAGE, id: { notIn: input.imageIds } },
        ],
      },
      data: { deletedAt: new Date() },
    });

    const { count } = await transaction.post.updateMany({
      where: {
        id: input.postId,
        authorId: input.authorId,
        type: PostType.RESEARCH,
        status: { not: PostStatus.ARCHIVED },
        deletedAt: null,
      },
      data: {
        title: input.title,
        summary: input.summary,
        content: input.content,
        status: input.status,
        publishedAt: input.publishedAt,
      },
    });

    if (count !== 1) {
      throw new Error(
        "게시글이 보관되었거나 수정할 수 없는 상태입니다. 목록에서 상태를 확인한 뒤 다시 시도해주세요.",
      );
    }
  });
}
