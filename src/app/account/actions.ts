"use server";

import { signOut } from "../../../auth";
import { revalidatePath } from "next/cache";
import { PostStatus } from "@/generated/prisma/enums";
import { assertResearcher } from "@/lib/researcher-auth";
import { prisma } from "@/lib/prisma";
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
    await prisma.$transaction([
      prisma.post.deleteMany({
        where: {
          authorId: user.id,
          status: PostStatus.DRAFT,
        },
      }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
  } catch (error) {
    logServerError("users.deleteSelf", error);
    throw error;
  }

  revalidatePath("/research");
  revalidatePath("/admin/posts");
  await signOut({ redirectTo: "/" });
}
