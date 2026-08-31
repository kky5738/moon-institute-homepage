"use server";

import { signOut } from "../../../auth";
import { revalidatePath, updateTag } from "next/cache";
import { PostStatus, PostType, UserStatus } from "@/generated/prisma/enums";
import { assertResearcher } from "@/lib/researcher-auth";
import { prisma } from "@/lib/prisma";
import { getPublishedPostsCacheTag } from "@/lib/posts";
import { logServerError } from "@/lib/server-log";
import { getSupabaseAuthAdminClient } from "@/lib/supabase-auth";

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function deleteAccount(formData: FormData) {
  if (formData.get("confirm") !== "yes") {
    throw new Error("탈퇴 확인이 필요합니다.");
  }

  const user = await assertResearcher();

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.DISABLED,
        sessionVersion: { increment: 1 },
      },
    });

    const { error: authDeleteError } =
      await getSupabaseAuthAdminClient().auth.admin.deleteUser(
        user.supabaseAuthId!,
      );
    if (authDeleteError) {
      throw new Error("Supabase Auth user deletion failed.", {
        cause: authDeleteError,
      });
    }

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

  updateTag(getPublishedPostsCacheTag(PostType.RESEARCH));
  revalidatePath("/research");
  revalidatePath("/admin/posts");
  await signOut({ redirectTo: "/" });
}
