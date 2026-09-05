"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendConfirmation } from "./actions";

export function ResendConfirmationForm() {
  const [remaining, setRemaining] = useState(0);
  const [message, formAction, pending] = useActionState(
    async (_previous: string, formData: FormData) => {
      try {
        return await resendConfirmation(formData);
      } catch {
        return "메일 요청을 처리하지 못했습니다. 60초 후 다시 시도해주세요.";
      } finally {
        setRemaining(60);
      }
    },
    "",
  );

  useEffect(() => {
    if (remaining === 0) return;
    const timer = window.setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  return (
    <form action={formAction} onReset={(event) => event.preventDefault()} className="mt-6 space-y-5">
      <div>
        <Label htmlFor="resend-email">가입한 이메일</Label>
        <Input
          id="resend-email"
          name="email"
          type="email"
          required
          maxLength={120}
          autoComplete="email"
          aria-describedby="resend-help"
          className="mt-2"
        />
        <p id="resend-help" className="mt-2 text-xs leading-5 text-muted">
          스팸함도 확인해주세요. 메일이 여러 개라면 가장 최근 메일의 링크를 이용해주세요.
        </p>
      </div>
      <p role="status" aria-live="polite" className="text-sm leading-6">{message}</p>
      <Button type="submit" disabled={pending || remaining > 0} className="w-full">
        {pending ? "요청 중" : remaining > 0 ? `${remaining}초 후 다시 보내기` : "인증 메일 다시 보내기"}
      </Button>
    </form>
  );
}
