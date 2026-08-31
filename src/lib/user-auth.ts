import { UserRole, UserStatus } from "@/generated/prisma/enums";

export const minimumPasswordLength = 15;
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

  const parsedPassword = parseNewPasswordInput(password, passwordConfirmation);
  if (!parsedPassword.ok) return parsedPassword;

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

export function parseNewPasswordInput(
  passwordValue: unknown,
  confirmationValue: unknown,
) {
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const passwordConfirmation =
    typeof confirmationValue === "string" ? confirmationValue : "";

  if (
    password.length < minimumPasswordLength ||
    password.length > maximumPasswordLength
  ) {
    return {
      ok: false as const,
      field: "password" as const,
      message: "비밀번호는 15~128자로 입력해주세요.",
    };
  }

  if (password !== passwordConfirmation) {
    return {
      ok: false as const,
      field: "passwordConfirmation" as const,
      message: "비밀번호 확인이 일치하지 않습니다.",
    };
  }

  return { ok: true as const, password };
}

export function isValidAuthTokenHash(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 20 &&
    value.length <= 512 &&
    !/\s/.test(value)
  );
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function canResearcherSignIn(user: {
  status: UserStatus;
  supabaseAuthId: string | null;
  emailVerifiedAt: Date | null;
}) {
  return (
    user.status === UserStatus.APPROVED &&
    Boolean(user.supabaseAuthId) &&
    Boolean(user.emailVerifiedAt)
  );
}

export function isLoginPassword(value: unknown): value is string {
  return typeof value === "string" && value.length <= maximumPasswordLength;
}

type AuthRole = "ADMIN" | "RESEARCHER";

export function getAuthNavigation(role: AuthRole | null) {
  if (role === "ADMIN") return { label: "관리자", href: "/admin" };
  if (role === "RESEARCHER") return { label: "내 정보", href: "/account" };
  return { label: "로그인", href: "/login" };
}

export function getPostLoginPath(role: AuthRole | null) {
  if (role === "ADMIN") return "/admin";
  if (role === "RESEARCHER") return "/";
  return "/login";
}
