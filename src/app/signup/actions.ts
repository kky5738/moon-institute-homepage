"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import {
  getAuthRedirectUrl,
  getSupabaseAuthAdminClient,
  getSupabaseAuthClient,
} from "@/lib/supabase-auth";
import { parseSignupInput, type SignupField } from "@/lib/user-auth";

export type SignupFormState = {
  status: "idle" | "success" | "error";
  field: SignupField | null;
  message: string;
};

const signupSuccess: SignupFormState = {
  status: "success",
  field: null,
  message:
    "확인 메일을 보냈습니다. 이메일 확인을 마치면 관리자 승인 대상으로 등록됩니다.",
};

export async function createUser(
  _previousState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const parsed = parseSignupInput({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
    privacyConsent: formData.get("privacyConsent") === "yes",
  });

  if (!parsed.ok) {
    return {
      status: "error",
      field: parsed.field,
      message: parsed.message,
    };
  }

  let supabaseAuthId: string | null = null;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (existingUser) return signupSuccess;

    const { data, error } = await getSupabaseAuthClient().auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { name: parsed.data.name },
        emailRedirectTo: getAuthRedirectUrl("/auth/confirm"),
      },
    });

    if (error || !data.user) {
      throw new Error("Supabase Auth signup failed.", { cause: error });
    }

    supabaseAuthId = data.user.id;
    if (data.session || data.user.email_confirmed_at) {
      throw new Error("Supabase Auth email confirmation is disabled.");
    }

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        supabaseAuthId,
        role: parsed.data.role,
        status: parsed.data.status,
      },
    });

    revalidatePath("/admin/users");

    return signupSuccess;
  } catch (error) {
    if (supabaseAuthId) {
      const { error: rollbackError } =
        await getSupabaseAuthAdminClient().auth.admin.deleteUser(supabaseAuthId);
      if (rollbackError) logServerError("users.signup.rollback", rollbackError);
    }
    logServerError("users.signup", error);

    return {
      status: "error",
      field: null,
      message: "가입 신청을 처리하지 못했습니다. 입력 내용을 확인하거나 잠시 후 다시 시도해주세요.",
    };
  }
}
