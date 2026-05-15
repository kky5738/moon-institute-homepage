"use server";

import { revalidatePath } from "next/cache";
import { InquiryType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialErrorState: ContactFormState = {
  status: "error",
  message: "입력값을 다시 확인해주세요.",
};

export async function createInquiry(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = parseInquiryForm(formData);

  if (!parsed.ok) {
    return {
      ...initialErrorState,
      message: parsed.message,
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
    };
  } catch (error) {
    logServerError("inquiries.create", error, {
      type: parsed.data.type,
    });

    return {
      status: "error",
      message: "문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}

function parseInquiryForm(formData: FormData):
  | {
      ok: true;
      data: {
        name: string;
        email: string | null;
        phone: string | null;
        type: InquiryType;
        subject: string | null;
        message: string;
      };
    }
  | { ok: false; message: string } {
  const name = getTrimmedString(formData, "name");
  const email = getOptionalString(formData, "email");
  const phone = getOptionalString(formData, "phone");
  const subject = getOptionalString(formData, "subject");
  const message = getTrimmedString(formData, "message");
  const type = parseInquiryType(getTrimmedString(formData, "type"));

  if (!type) {
    return { ok: false, message: "문의 유형을 선택해주세요." };
  }

  if (name.length < 2 || name.length > 80) {
    return { ok: false, message: "이름은 2자 이상 80자 이하로 입력해주세요." };
  }

  if (!email && !phone) {
    return { ok: false, message: "이메일 또는 연락처 중 하나를 입력해주세요." };
  }

  if (email && !isValidEmail(email)) {
    return { ok: false, message: "이메일 형식을 확인해주세요." };
  }

  if (phone && phone.length > 40) {
    return { ok: false, message: "연락처는 40자 이하로 입력해주세요." };
  }

  if (subject && subject.length > 120) {
    return { ok: false, message: "제목은 120자 이하로 입력해주세요." };
  }

  if (message.length < 10 || message.length > 2000) {
    return {
      ok: false,
      message: "문의 내용은 10자 이상 2000자 이하로 입력해주세요.",
    };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      phone,
      type,
      subject,
      message,
    },
  };
}

function getTrimmedString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = getTrimmedString(formData, key);
  return value.length > 0 ? value : null;
}

function parseInquiryType(value: string) {
  if (value === InquiryType.GENERAL) {
    return InquiryType.GENERAL;
  }

  if (value === InquiryType.PARTICIPATION) {
    return InquiryType.PARTICIPATION;
  }

  if (value === InquiryType.DONATION_INTEREST) {
    return InquiryType.DONATION_INTEREST;
  }

  return null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
