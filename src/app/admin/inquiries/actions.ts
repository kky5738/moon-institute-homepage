"use server";

import { revalidatePath } from "next/cache";
import { InquiryStatus } from "@/generated/prisma/enums";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";

export async function updateInquiryStatus(formData: FormData) {
  await assertAdmin();

  try {
    const id = Number(getRequiredString(formData, "id"));
    const status = parseInquiryStatus(getRequiredString(formData, "status"));

    if (!Number.isInteger(id) || id < 1) {
      throw new Error("유효한 문의 ID가 필요합니다.");
    }

    await prisma.inquiry.update({
      where: { id },
      data: {
        status,
        archivedAt: status === InquiryStatus.ARCHIVED ? new Date() : null,
      },
    });
  } catch (error) {
    logServerError("admin.inquiries.updateStatus", error);
    throw error;
  }

  revalidatePath("/admin/inquiries");
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return value.trim();
}

function parseInquiryStatus(value: string) {
  if (value === InquiryStatus.NEW) {
    return InquiryStatus.NEW;
  }

  if (value === InquiryStatus.REVIEWED) {
    return InquiryStatus.REVIEWED;
  }

  if (value === InquiryStatus.ARCHIVED) {
    return InquiryStatus.ARCHIVED;
  }

  throw new Error("유효하지 않은 문의 상태입니다.");
}
