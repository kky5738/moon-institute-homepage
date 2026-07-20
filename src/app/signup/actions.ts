"use server";

import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { parseSignupInput } from "@/lib/user-auth";

export type SignupFormState = {
  status: "idle" | "success" | "error";
  message: string;
  submissionId: number;
};

export async function createUser(
  previousState: SignupFormState,
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
      message: parsed.message,
      submissionId: previousState.submissionId,
    };
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        status: parsed.data.status,
      },
    });

    revalidatePath("/admin/users");

    return {
      status: "success",
      message: "가입 신청이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.",
      submissionId: previousState.submissionId + 1,
    };
  } catch (error) {
    logServerError("users.signup", error);

    return {
      status: "error",
      message: "가입 신청을 처리하지 못했습니다. 입력 내용을 확인하거나 잠시 후 다시 시도해주세요.",
      submissionId: previousState.submissionId,
    };
  }
}
