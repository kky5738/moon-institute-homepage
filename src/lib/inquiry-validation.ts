import { InquiryType } from "@/generated/prisma/enums";

export function parseInquiryForm(formData: FormData):
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

  if (email && email.length > 120) {
    return { ok: false, message: "이메일은 120자 이하로 입력해주세요." };
  }

  if (phone) {
    const digits = phone.replace(/[^0-9]/g, "").length;
    if (phone.length > 40 || !/^\+?[0-9]+(?:[ -][0-9]+)*$/.test(phone) || digits < 7 || digits > 15) {
      return { ok: false, message: "연락처는 숫자 7~15자리로 입력하고, 맨 앞의 +와 숫자 사이 공백 1칸 또는 하이픈 1개만 사용해주세요." };
    }
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
