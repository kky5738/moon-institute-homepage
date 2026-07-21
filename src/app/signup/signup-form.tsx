"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, type SignupFormState } from "./actions";

const initialState: SignupFormState = {
  status: "idle",
  field: null,
  message: "",
};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "error") {
      return;
    }

    const form = formRef.current;
    if (!form) return;

    for (const name of ["password", "passwordConfirmation"]) {
      const input = form.elements.namedItem(name);
      if (input instanceof HTMLInputElement) input.value = "";
    }

    const invalidField = state.field && form.elements.namedItem(state.field);
    if (invalidField instanceof HTMLInputElement) invalidField.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <section
        role="status"
        aria-live="polite"
        className="mt-6 border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"
      >
        <h2 className="text-xl font-semibold">관리자 승인 대기 중</h2>
        <p className="mt-3 text-sm leading-6">{state.message}</p>
        <p className="mt-2 text-sm leading-6">
          승인 전에는 로그인할 수 없습니다. 승인이 완료된 뒤 가입한 이메일과
          비밀번호로 로그인해주세요.
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-5" })}>
          랜딩 페이지로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onReset={(event) => event.preventDefault()}
      className="mt-6 space-y-5"
    >
      <div>
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          aria-invalid={state.field === "name" ? true : undefined}
          aria-describedby={state.field === "name" ? "signup-error" : undefined}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          maxLength={120}
          autoComplete="email"
          aria-invalid={state.field === "email" ? true : undefined}
          aria-describedby={state.field === "email" ? "signup-error" : undefined}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={12}
          maxLength={128}
          pattern="(?=.*[A-Za-z])(?=.*[0-9]).{12,128}"
          autoComplete="new-password"
          aria-invalid={state.field === "password" ? true : undefined}
          aria-describedby={
            state.field === "password"
              ? "password-help signup-error"
              : "password-help"
          }
          className="mt-2"
        />
        <p id="password-help" className="mt-2 text-xs leading-5 text-muted">
          12~128자로 영문자와 숫자를 포함해주세요.
        </p>
      </div>

      <div>
        <Label htmlFor="passwordConfirmation">비밀번호 확인</Label>
        <Input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          aria-invalid={
            state.field === "passwordConfirmation" ? true : undefined
          }
          aria-describedby={
            state.field === "passwordConfirmation" ? "signup-error" : undefined
          }
          className="mt-2"
        />
      </div>

      <div className="border border-border bg-background p-4 text-xs leading-5 text-muted">
        <p>
          이름, 이메일, 비밀번호(해시 형태로 저장)를 가입 신청, 연구원 확인,
          계정 및 접근권한 관리를 위해 처리합니다. 승인된 회원정보는 탈퇴
          시까지, 승인되지 않은 신청정보는 신청일부터 30일간 보관한 뒤
          삭제합니다. 필수정보 수집에 동의하지 않으면 회원가입을 신청할 수
          없습니다.
        </p>
        <label className="mt-3 flex items-start gap-2 font-medium text-foreground">
          <input
            type="checkbox"
            name="privacyConsent"
            value="yes"
            required
            aria-invalid={
              state.field === "privacyConsent" ? true : undefined
            }
            aria-describedby={
              state.field === "privacyConsent" ? "signup-error" : undefined
            }
            className="mt-1"
          />
          <span>필수 개인정보 수집·이용에 동의합니다.</span>
        </label>
      </div>

      <p className="text-xs leading-5 text-muted">
        현재 이메일 인증과 비밀번호 재설정은 제공하지 않습니다. 계정 관련
        도움이 필요하면 문의 페이지를 이용해주세요.
      </p>

      {state.message ? (
        <p
          id="signup-error"
          role="alert"
          aria-live="assertive"
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "신청 중" : "가입 신청"}
      </Button>
    </form>
  );
}
