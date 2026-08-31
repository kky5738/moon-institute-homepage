"use server";

import { logServerError } from "@/lib/server-log";
import { getAuthRedirectUrl, getSupabaseAuthClient } from "@/lib/supabase-auth";
import { isValidEmail, normalizeEmail } from "@/lib/user-auth";

export type ForgotPasswordState = {
  status: "idle" | "success";
  message: string;
};

const commonResponse: ForgotPasswordState = {
  status: "success",
  message:
    "입력한 이메일로 등록된 계정이 있으면 비밀번호 재설정 안내를 보냈습니다.",
};

export async function requestPasswordReset(
  _previousState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = normalizeEmail(formData.get("email"));
  if (!isValidEmail(email) || email.length > 120) return commonResponse;

  try {
    const { error } = await getSupabaseAuthClient().auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl("/reset-password"),
    });
    if (error) logServerError("auth.requestPasswordReset", error);
  } catch (error) {
    logServerError("auth.requestPasswordReset", error);
  }

  return commonResponse;
}
