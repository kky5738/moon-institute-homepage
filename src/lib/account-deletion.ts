import { UserStatus } from "@/generated/prisma/enums";
import { completeAccountDeletion, deleteDraftPostsWithFiles } from "@/lib/account-deletion-flow";
import { prisma } from "@/lib/prisma";
import { getSupabaseAuthAdminClient } from "@/lib/supabase-auth";
import { removeResearchObjects } from "@/lib/supabase-storage";

export async function finishAccountDeletion(userId: number, expectedAuthId?: string) {
  await prisma.$transaction(async (transaction) => {
    // 같은 회원의 탈퇴 처리를 직렬화해 외부 파일 삭제까지 중복 실행하지 않는다.
    const [user] = await transaction.$queryRaw<Array<{ status: UserStatus; supabaseAuthId: string | null }>>`
      SELECT status, "supabaseAuthId" FROM users WHERE id = ${userId} FOR UPDATE
    `;
    if (!user) return;
    if (user.status !== UserStatus.DELETION_PENDING || !user.supabaseAuthId ||
        (expectedAuthId !== undefined && user.supabaseAuthId !== expectedAuthId)) {
      throw new Error("탈퇴 처리 중인 계정을 찾을 수 없습니다.");
    }
    const authId = user.supabaseAuthId;
    await completeAccountDeletion(
      () => getSupabaseAuthAdminClient().auth.admin.deleteUser(authId),
      async () => {
        await deleteDraftPostsWithFiles(transaction, userId, removeResearchObjects);
        await transaction.user.delete({ where: { id: userId } });
      },
    );
  }, { timeout: 30_000 });
}
