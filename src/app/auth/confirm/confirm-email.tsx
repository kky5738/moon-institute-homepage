"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { isValidAuthTokenHash } from "@/lib/user-auth";
import { confirmEmail, type ConfirmEmailState } from "./actions";

const initialState: ConfirmEmailState = {
  status: "loading",
  message: "이메일 주소를 확인하고 있습니다.",
};

export function ConfirmEmail() {
  const started = useRef(false);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const parameters = new URLSearchParams(window.location.hash.slice(1));
    const tokenHash = parameters.get("token_hash");
    const type = parameters.get("type");
    window.history.replaceState(null, "", window.location.pathname);

    if (!isValidAuthTokenHash(tokenHash) || type !== "email") {
      queueMicrotask(() =>
        setState({
          status: "error",
          message: "확인 링크가 올바르지 않습니다. 이메일의 링크를 다시 열어주세요.",
        }),
      );
      return;
    }

    void confirmEmail(tokenHash)
      .then(setState)
      .catch(() =>
        setState({
          status: "error",
          message: "이메일 확인을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
        }),
      );
  }, []);

  return (
    <section aria-live="polite">
      <p className={state.status === "error" ? "text-red-800" : "text-muted"}>
        {state.message}
      </p>
      {state.status !== "loading" ? (
        <Link href="/login" className={buttonVariants({ className: "mt-6" })}>
          로그인으로 이동
        </Link>
      ) : null}
    </section>
  );
}
