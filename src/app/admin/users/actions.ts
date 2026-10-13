"use server";

import { revalidatePath, updateTag } from "next/cache";
import { PostType, UserStatus } from "@/generated/prisma/enums";
import { assertAdmin } from "@/lib/admin-auth";
import { finishAccountDeletion } from "@/lib/account-deletion";
import { getPublishedPostsCacheTag } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";

export async function updateUserStatus(formData: FormData) {
  await assertAdmin();

  const id = Number(formData.get("id"));
  const status = parseStatus(formData.get("status"));

  if (!Number.isInteger(id) || id < 1 || !status) {
    throw new Error("유효한 회원 상태 변경 요청이 아닙니다.");
  }

  try {
    if (status === UserStatus.APPROVED) {
      const result = await prisma.user.updateMany({
        where: {
          id,
          status: { in: [UserStatus.PENDING, UserStatus.DISABLED] },
          supabaseAuthId: { not: null },
          emailVerifiedAt: { not: null },
        },
        data: { status, statusChangedAt: new Date() },
      });
      if (result.count !== 1) {
        throw new Error("이메일 확인이 완료된 회원만 승인할 수 있습니다.");
      }
    } else {
      const result = await prisma.user.updateMany({
        where: { id, status: { not: UserStatus.DELETION_PENDING } },
        data: {
          status,
          statusChangedAt: new Date(),
          sessionVersion: { increment: 1 },
        },
      });
      if (result.count !== 1) throw new Error("탈퇴 처리 중인 회원은 상태를 변경할 수 없습니다.");
    }
  } catch (error) {
    logServerError("admin.users.updateStatus", error);
    throw error;
  }

  revalidatePath("/admin/users");
}

export async function retryAccountDeletion(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new Error("유효한 회원 ID가 필요합니다.");

  try {
    await finishAccountDeletion(id);
  } catch (error) {
    logServerError("admin.users.retryDeletion", error, { userId: id });
    throw error;
  }

  updateTag(getPublishedPostsCacheTag(PostType.RESEARCH));
  revalidatePath("/research");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/users");
}

function parseStatus(value: FormDataEntryValue | null) {
  if (value === UserStatus.APPROVED) {
    return UserStatus.APPROVED;
  }

  if (value === UserStatus.DISABLED) {
    return UserStatus.DISABLED;
  }

  return null;
}
