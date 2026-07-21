import { UserRole, UserStatus } from "@/generated/prisma/enums";

export const minimumPasswordLength = 12;
export const maximumPasswordLength = 128;

type SignupInput = {
  name: unknown;
  email: unknown;
  password: unknown;
  passwordConfirmation: unknown;
  privacyConsent: unknown;
};

export type SignupField = keyof SignupInput;

export function parseSignupInput(input: SignupInput) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = normalizeEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  const passwordConfirmation =
    typeof input.passwordConfirmation === "string"
      ? input.passwordConfirmation
      : "";

  if (name.length < 2 || name.length > 80) {
    return {
      ok: false as const,
      field: "name" as const,
      message: "이름은 2자 이상 80자 이하로 입력해주세요.",
    };
  }

  if (!isValidEmail(email) || email.length > 120) {
    return {
      ok: false as const,
      field: "email" as const,
      message: "이메일 형식을 확인해주세요.",
    };
  }

  if (
    password.length < minimumPasswordLength ||
    password.length > maximumPasswordLength ||
    !/[A-Za-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return {
      ok: false as const,
      field: "password" as const,
      message: "비밀번호는 12~128자로 영문자와 숫자를 포함해주세요.",
    };
  }

  if (password !== passwordConfirmation) {
    return {
      ok: false as const,
      field: "passwordConfirmation" as const,
      message: "비밀번호 확인이 일치하지 않습니다.",
    };
  }

  if (input.privacyConsent !== true) {
    return {
      ok: false as const,
      field: "privacyConsent" as const,
      message: "필수 개인정보 수집·이용에 동의해주세요.",
    };
  }

  return {
    ok: true as const,
    data: {
      name,
      email,
      password,
      role: UserRole.RESEARCHER,
      status: UserStatus.PENDING,
    },
  };
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function canResearcherSignIn(status: UserStatus) {
  return status === UserStatus.APPROVED;
}
