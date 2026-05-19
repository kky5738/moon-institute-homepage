"use client";

import { useActionState, useEffect, useRef } from "react";
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
        <label htmlFor="type" className="text-sm font-semibold text-neutral-900">
          문의 유형
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue="GENERAL"
          className="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:border-neutral-950"
        >
          <option value="GENERAL">일반 문의</option>
          <option value="PARTICIPATION">참여 신청</option>
          <option value="DONATION_INTEREST">후원 관심</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-semibold text-neutral-900">
            이름
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            className="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:border-neutral-950"
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-semibold text-neutral-900">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={120}
            autoComplete="email"
            className="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:border-neutral-950"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="text-sm font-semibold text-neutral-900">
          연락처
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          maxLength={40}
          autoComplete="tel"
          className="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:border-neutral-950"
        />
        <p className="mt-2 text-xs leading-5 text-neutral-500">
          이메일 또는 연락처 중 하나는 입력해주세요.
        </p>
      </div>

      <div>
        <label htmlFor="subject" className="text-sm font-semibold text-neutral-900">
          제목
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          maxLength={120}
          className="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:border-neutral-950"
        />
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-semibold text-neutral-900">
          내용
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={8}
          className="mt-2 w-full resize-y border border-neutral-300 bg-white px-3 py-3 text-sm leading-6 text-neutral-950 outline-none focus:border-neutral-950"
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

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-400 disabled:bg-neutral-400"
      >
        {pending ? "접수 중" : "문의 접수"}
      </button>
    </form>
  );
}
