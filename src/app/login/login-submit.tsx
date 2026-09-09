"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function LoginSubmit() {
  const { pending } = useFormStatus();

  return (
    <div>
      <Button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        size="lg"
        className="w-full gap-2 bg-primary-dark hover:bg-primary active:bg-primary disabled:hover:bg-primary-dark disabled:active:bg-primary-dark transition-[background-color,transform] duration-150 ease-out motion-safe:[&:active:not(:focus-visible)]:scale-[0.97]"
      >
        <span
          aria-hidden="true"
          className={`h-4 w-4 rounded-full border-2 border-current border-r-transparent ${pending ? "motion-safe:animate-spin" : "invisible"}`}
        />
        {pending ? "로그인 중…" : "로그인"}
        <span aria-hidden="true" className="h-4 w-4" />
      </Button>
      <p role="status" aria-live="polite" className="mt-2 min-h-10 text-center text-xs leading-5 text-muted">
        {pending ? <LoginPendingMessage /> : null}
      </p>
    </div>
  );
}

function LoginPendingMessage() {
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDelayed(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return delayed
    ? "로그인 확인이 지연되고 있습니다. 잠시 기다려주세요."
    : "로그인을 확인하고 있습니다.";
}
