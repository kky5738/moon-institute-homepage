"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, type SignupFormState } from "./actions";

const initialState: SignupFormState = {
  status: "idle",
  message: "",
  submissionId: 0,
};

export function SignupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createUser, initialState);

  useEffect(() => {
    if (state.submissionId > 0) {
      formRef.current?.reset();
    }
  }, [state.submissionId]);

  return (
    <form ref={formRef} action={formAction} className="mt-6 space-y-5">
      <div>
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
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
          aria-describedby="password-help"
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
          role={state.status === "error" ? "alert" : "status"}
          aria-live={state.status === "error" ? "assertive" : "polite"}
          className={
            state.status === "success"
              ? "border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
              : "border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          }
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
