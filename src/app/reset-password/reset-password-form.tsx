"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidAuthTokenHash } from "@/lib/user-auth";
import { resetPassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {
  status: "idle",
  field: null,
  message: "",
};

export function ResetPasswordForm() {
  const loaded = useRef(false);
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const parameters = new URLSearchParams(window.location.hash.slice(1));
    const token = parameters.get("token_hash");
    const type = parameters.get("type");
    window.history.replaceState(null, "", window.location.pathname);

    if (!isValidAuthTokenHash(token) || type !== "recovery") {
      queueMicrotask(() =>
        setState({
          status: "error",
          field: null,
          message: "재설정 링크가 올바르지 않습니다. 새 링크를 요청해주세요.",
        }),
      );
      return;
    }
    queueMicrotask(() => setTokenHash(token));
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tokenHash) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      try {
        setState(await resetPassword(tokenHash, formData));
      } catch {
        setState({
          status: "error",
          field: null,
          message: "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.",
        });
      } finally {
        form.reset();
      }
    });
  }

  if (state.status === "success") {
    return (
      <section role="status" aria-live="polite" className="text-sm leading-6">
        <p>{state.message}</p>
        <Link href="/login" className={buttonVariants({ className: "mt-5" })}>
          로그인으로 이동
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <Label htmlFor="password">새 비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={15}
          maxLength={128}
          autoComplete="new-password"
          aria-invalid={state.field === "password" ? true : undefined}
          className="mt-2"
        />
        <p className="mt-2 text-xs leading-5 text-muted">15~128자로 입력해주세요.</p>
      </div>
      <div>
        <Label htmlFor="passwordConfirmation">새 비밀번호 확인</Label>
        <Input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          required
          minLength={15}
          maxLength={128}
          autoComplete="new-password"
          aria-invalid={state.field === "passwordConfirmation" ? true : undefined}
          className="mt-2"
        />
      </div>
      {state.message ? (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={!tokenHash || pending} size="lg" className="w-full">
        {pending ? "변경 중" : "비밀번호 변경"}
      </Button>
      {state.status === "error" && !tokenHash ? (
        <Link href="/forgot-password" className="block text-center text-sm font-semibold text-primary hover:underline">
          새 재설정 링크 요청
        </Link>
      ) : null}
    </form>
  );
}
