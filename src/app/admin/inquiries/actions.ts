"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { InquiryStatus } from "@/generated/prisma/enums";
import { AdminUnauthorizedError, assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { parseInquiryForm } from "@/lib/inquiry-validation";

export async function updateInquiryStatus(formData: FormData) {
  await assertAdmin();

  try {
    const id = getId(formData);
    const status = parseInquiryStatus(getRequiredString(formData, "status"));

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
  revalidatePath(`/admin/inquiries/${getId(formData)}`);
}

export type InquiryActionState = { message: string };

export async function updateInquiry(_previous: InquiryActionState, formData: FormData): Promise<InquiryActionState> {
  let id: number;
  try {
    await assertAdmin();
    try { id = getId(formData); } catch { return { message: "유효한 문의 ID가 필요합니다." }; }
    const parsed = parseInquiryForm(formData);
    if (!parsed.ok) return { message: parsed.message };
    const result = await prisma.inquiry.updateMany({ where: { id }, data: parsed.data });
    if (!result.count) return { message: "이미 삭제되었거나 존재하지 않는 문의입니다." };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AdminUnauthorizedError) return { message: "관리자 인증이 필요합니다. 다시 로그인해주세요." };
    logServerError("admin.inquiries.update", error);
    return { message: "정정 내용을 저장하지 못했습니다. 다시 시도해주세요." };
  }
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
  redirect(`/admin/inquiries/${id}`);
}

export async function completeInquiry(formData: FormData) {
  await assertAdmin();
  const id = getId(formData);
  const result = await prisma.inquiry.updateMany({
    where: { id, completedAt: null },
    data: { completedAt: new Date() },
  });
  if (!result.count && !await prisma.inquiry.findUnique({ where: { id }, select: { id: true } })) {
    throw new Error("문의가 존재하지 않습니다.");
  }
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
}

export async function deleteInquiry(_previous: InquiryActionState, formData: FormData): Promise<InquiryActionState> {
  let id: number;
  try {
    await assertAdmin();
    try {
      id = getId(formData);
    } catch {
      return { message: "유효한 문의 ID가 필요합니다." };
    }
    const result = await prisma.inquiry.deleteMany({ where: { id } });
    if (!result.count) return { message: "이미 삭제되었거나 존재하지 않는 문의입니다." };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AdminUnauthorizedError) return { message: "관리자 인증이 필요합니다. 다시 로그인해주세요." };
    logServerError("admin.inquiries.delete", error);
    return { message: "삭제하지 못했습니다. 다시 시도해주세요." };
  }
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
  redirect("/admin/inquiries");
}

function getId(formData: FormData) {
  const id = Number(getRequiredString(formData, "id"));
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new Error("유효한 문의 ID가 필요합니다.");
  return id;
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
