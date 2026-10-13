import { UserStatus } from "@/generated/prisma/enums";
import { completeAccountDeletion, deleteDraftPostsWithFiles } from "@/lib/account-deletion-flow";
import { prisma } from "@/lib/prisma";
import { getSupabaseAuthAdminClient } from "@/lib/supabase-auth";
import { removeResearchObjects } from "@/lib/supabase-storage";

export async function finishAccountDeletion(userId: number, supabaseAuthId: string) {
  await completeAccountDeletion(
    () => getSupabaseAuthAdminClient().auth.admin.deleteUser(supabaseAuthId),
    () => prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findFirst({
        where: { id: userId, status: UserStatus.DELETION_PENDING, supabaseAuthId },
        select: { id: true },
      });
      if (!user) throw new Error("탈퇴 처리 중인 계정을 찾을 수 없습니다.");

      await deleteDraftPostsWithFiles(transaction, userId, removeResearchObjects);
      await transaction.user.delete({ where: { id: userId } });
    }),
  );
}
