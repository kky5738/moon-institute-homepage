"use server";

import { revalidatePath } from "next/cache";
import { UserStatus } from "@/generated/prisma/enums";
import { assertAdmin } from "@/lib/admin-auth";
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
          supabaseAuthId: { not: null },
          emailVerifiedAt: { not: null },
        },
        data: { status, statusChangedAt: new Date() },
      });
      if (result.count !== 1) {
        throw new Error("이메일 확인이 완료된 회원만 승인할 수 있습니다.");
      }
    } else {
      await prisma.user.update({
        where: { id },
        data: {
          status,
          statusChangedAt: new Date(),
          sessionVersion: { increment: 1 },
        },
      });
    }
  } catch (error) {
    logServerError("admin.users.updateStatus", error);
    throw error;
  }

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
