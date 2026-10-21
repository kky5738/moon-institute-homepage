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
  removedIds: string[];
};

export async function saveResearchPostAtomically(
  database: ResearchPostSaveDatabase,
  input: ResearchPostSaveInput,
) {
  await database.$transaction(async (transaction) => {
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
