"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { consumeInquiryAttempt } from "@/lib/inquiry-throttle";
import { parseInquiryForm } from "@/lib/inquiry-validation";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
  submissionId: number;
};

export async function createInquiry(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = parseInquiryForm(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.message,
      submissionId: prevState.submissionId,
    };
  }

  try {
    if (!await consumeInquiryAttempt(await headers())) {
      return {
        status: "error",
        message: "문의 접수가 너무 많습니다. 잠시 기다린 뒤 다시 시도해주세요. 15분 동안 최대 5건을 접수할 수 있습니다.",
        submissionId: prevState.submissionId,
      };
    }
  } catch (error) {
    logServerError("inquiries.throttle", error);
    return {
      status: "error",
      message: "문의 접수를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해주세요.",
      submissionId: prevState.submissionId,
    };
  }

  try {
    await prisma.inquiry.create({
      data: parsed.data,
    });

    revalidatePath("/admin/inquiries");

    return {
      status: "success",
      message: "문의가 접수되었습니다. 검토 후 필요한 경우 연락드리겠습니다.",
      submissionId: prevState.submissionId + 1,
    };
  } catch (error) {
    logServerError("inquiries.create", error, {
      type: parsed.data.type,
    });

    return {
      status: "error",
      message: "문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      submissionId: prevState.submissionId,
    };
  }
}
