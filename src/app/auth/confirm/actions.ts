"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { getSupabaseAuthClient } from "@/lib/supabase-auth";
import { isValidAuthTokenHash } from "@/lib/user-auth";

export type ConfirmEmailState = {
  status: "loading" | "success" | "error";
  message: string;
};

export async function confirmEmail(tokenHash: string): Promise<ConfirmEmailState> {
  if (!isValidAuthTokenHash(tokenHash)) return confirmationError;

  try {
    const { data, error } = await getSupabaseAuthClient().auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });
    if (error || !data.user?.email_confirmed_at) {
      throw new Error("Supabase Auth email verification failed.", { cause: error });
    }

    const result = await prisma.user.updateMany({
      where: { supabaseAuthId: data.user.id },
      data: { emailVerifiedAt: new Date(data.user.email_confirmed_at) },
    });
    if (result.count !== 1) throw new Error("Linked application user was not found.");

    revalidatePath("/admin/users");
    return {
      status: "success",
      message: "이메일 확인이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.",
    };
  } catch (error) {
    logServerError("auth.confirmEmail", error);
    return confirmationError;
  }
}

const confirmationError: ConfirmEmailState = {
  status: "error",
  message: "확인 링크가 유효하지 않거나 만료되었습니다. 다시 가입하거나 관리자에게 문의해주세요.",
};
