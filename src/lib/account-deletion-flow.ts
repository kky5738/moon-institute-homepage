import type { Prisma } from "@/generated/prisma/client";

export async function completeAccountDeletion(
  deleteAuthUser: () => Promise<{ error: { status?: number; code?: string } | null }>,
  deleteDatabaseUser: () => Promise<void>,
) {
  const { error } = await deleteAuthUser();
  if (error && !(error.status === 404 && error.code === "user_not_found")) {
    throw new Error("Supabase Auth user deletion failed.", { cause: error });
  }
  await deleteDatabaseUser();
}

export async function deleteDraftPostsWithFiles(
  transaction: Prisma.TransactionClient,
  userId: number,
  removeObjects: (paths: string[]) => Promise<void>,
) {
  // 파일 정리 중 초안이 공개 글로 바뀌지 않도록 삭제 대상 행을 잠근다.
  const drafts = await transaction.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM posts
    WHERE "authorId" = ${userId} AND status = 'DRAFT'
    ORDER BY id FOR UPDATE
  `;
  if (drafts.length === 0) return;

  const postIds = drafts.map((post) => post.id);
  const files = await transaction.postAttachment.findMany({
    where: { postId: { in: postIds } },
    select: { objectPath: true },
  });
  await removeObjects(files.map((file) => file.objectPath));
  await transaction.post.deleteMany({ where: { id: { in: postIds } } });
}
