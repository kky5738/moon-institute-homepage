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
    await prisma.user.update({
      where: { id },
      data: { status, statusChangedAt: new Date() },
    });
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
