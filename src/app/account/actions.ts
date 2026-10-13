"use server";

import { signOut } from "../../../auth";
import { revalidatePath, updateTag } from "next/cache";
import { PostType, UserStatus } from "@/generated/prisma/enums";
import { finishAccountDeletion } from "@/lib/account-deletion";
import { assertResearcher } from "@/lib/researcher-auth";
import { prisma } from "@/lib/prisma";
import { getPublishedPostsCacheTag } from "@/lib/posts";
import { logServerError } from "@/lib/server-log";

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function deleteAccount(formData: FormData) {
  if (formData.get("confirm") !== "yes") {
    throw new Error("탈퇴 확인이 필요합니다.");
  }

  const user = await assertResearcher();

  try {
    const result = await prisma.user.updateMany({
      where: { id: user.id, status: UserStatus.APPROVED },
      data: {
        status: UserStatus.DELETION_PENDING,
        statusChangedAt: new Date(),
        name: "탈퇴 처리 중",
        email: `deleted-${user.id}@invalid.invalid`,
        passwordHash: null,
        sessionVersion: { increment: 1 },
      },
    });
    if (result.count !== 1) throw new Error("탈퇴 요청을 처리할 수 없습니다.");
  } catch (error) {
    logServerError("users.requestDeletion", error);
    throw error;
  }

  updateTag(getPublishedPostsCacheTag(PostType.RESEARCH));
  revalidatePath("/research");
  revalidatePath("/admin/posts");

  try {
    await finishAccountDeletion(user.id, user.supabaseAuthId!);
  } catch (error) {
    logServerError("users.deleteSelf", error, { userId: user.id });
    await signOut({ redirectTo: "/account/deletion-pending" });
    return;
  }

  updateTag(getPublishedPostsCacheTag(PostType.RESEARCH));
  revalidatePath("/research");
  revalidatePath("/admin/posts");
  await signOut({ redirectTo: "/" });
}
