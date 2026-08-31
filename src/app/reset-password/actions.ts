"use server";

import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import {
  getSupabaseAuthAdminClient,
  getSupabaseAuthClient,
} from "@/lib/supabase-auth";
import { isValidAuthTokenHash, parseNewPasswordInput } from "@/lib/user-auth";

export type ResetPasswordState = {
  status: "idle" | "success" | "error";
  field: "password" | "passwordConfirmation" | null;
  message: string;
};

export async function resetPassword(
  tokenHash: string,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = parseNewPasswordInput(
    formData.get("password"),
    formData.get("passwordConfirmation"),
  );
  if (!parsed.ok) {
    return { status: "error", field: parsed.field, message: parsed.message };
  }
  if (!isValidAuthTokenHash(tokenHash)) return invalidResetLink;

  try {
    const { data, error } = await getSupabaseAuthClient().auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (error || !data.user) {
      throw new Error("Supabase Auth recovery verification failed.", { cause: error });
    }

    const appUser = await prisma.user.findUnique({
      where: { supabaseAuthId: data.user.id },
      select: { id: true },
    });
    if (!appUser) throw new Error("Linked application user was not found.");

    await prisma.user.update({
      where: { id: appUser.id },
      data: { sessionVersion: { increment: 1 }, passwordHash: null },
    });

    const { error: updateError } =
      await getSupabaseAuthAdminClient().auth.admin.updateUserById(data.user.id, {
        password: parsed.password,
      });
    if (updateError) {
      throw new Error("Supabase Auth password update failed.", {
        cause: updateError,
      });
    }

    return {
      status: "success",
      field: null,
      message: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.",
    };
  } catch (error) {
    logServerError("auth.resetPassword", error);
    return invalidResetLink;
  }
}

const invalidResetLink: ResetPasswordState = {
  status: "error",
  field: null,
  message: "재설정 링크가 유효하지 않거나 만료되었습니다. 새 링크를 요청해주세요.",
};
