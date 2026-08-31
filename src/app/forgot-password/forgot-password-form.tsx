"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = { status: "idle", message: "" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.status === "success") {
    return (
      <section role="status" aria-live="polite" className="mt-6 text-sm leading-6">
        <p>{state.message}</p>
        <Link href="/login" className={buttonVariants({ className: "mt-5" })}>
          로그인으로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-5">
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
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "요청 중" : "재설정 메일 받기"}
      </Button>
    </form>
  );
}
