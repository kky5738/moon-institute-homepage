"use server";

import { logServerError } from "@/lib/server-log";
import { getAuthRedirectUrl, getSupabaseAuthClient } from "@/lib/supabase-auth";
import { isValidEmail, normalizeEmail } from "@/lib/user-auth";

export async function resendConfirmation(formData: FormData): Promise<string> {
  const email = normalizeEmail(formData.get("email"));
  if (!isValidEmail(email) || email.length > 120) {
    return "이메일 형식을 확인해주세요.";
  }

  try {
    const { error } = await getSupabaseAuthClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: getAuthRedirectUrl("/auth/confirm") },
    });
    if (error) {
      logServerError("auth.resendConfirmation", {
        name: error.name,
        code: error.code,
        status: error.status,
      });
      if ((error.status ?? 0) >= 500) {
        return "메일 요청을 처리하지 못했습니다. 60초 후 다시 시도해주세요.";
      }
    }
  } catch {
    logServerError("auth.resendConfirmation", { name: "RequestFailed" });
    return "메일 요청을 처리하지 못했습니다. 60초 후 다시 시도해주세요.";
  }

  // Supabase의 계정별 발송 제한을 사용하고 가입·인증 여부는 공개하지 않는다.
  return "아직 이메일 확인을 마치지 않은 가입 계정이면 확인 메일을 보냅니다. 최근에 요청했다면 60초 후 다시 시도해주세요.";
}
