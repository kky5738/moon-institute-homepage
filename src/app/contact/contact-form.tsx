"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createInquiry, type ContactFormState } from "./actions";

const initialState: ContactFormState = {
  status: "idle",
  message: "",
  submissionId: 0,
};

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createInquiry, initialState);

  useEffect(() => {
    if (state.submissionId > 0) {
      formRef.current?.reset();
    }
  }, [state.submissionId]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="type">
          문의 유형
        </Label>
        <select
          id="type"
          name="type"
          required
          defaultValue="GENERAL"
          className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
        >
          <option value="GENERAL">일반 문의</option>
          <option value="PARTICIPATION">참여 신청</option>
          <option value="DONATION_INTEREST">후원 관심</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">
            이름
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email">
            이메일
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            maxLength={120}
            autoComplete="email"
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">
          연락처
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          maxLength={40}
          autoComplete="tel"
          className="mt-2"
        />
        <p className="mt-2 text-xs leading-5 text-muted">
          이메일 또는 연락처 중 하나는 입력해주세요.
        </p>
      </div>

      <div>
        <Label htmlFor="subject">
          제목
        </Label>
        <Input
          id="subject"
          name="subject"
          type="text"
          maxLength={120}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="message">
          내용
        </Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={8}
          className="mt-2 resize-y"
        />
      </div>

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "success"
              ? "border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
              : "border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          }
        >
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        size="lg"
      >
        {pending ? "접수 중" : "문의 접수"}
      </Button>
    </form>
  );
}
