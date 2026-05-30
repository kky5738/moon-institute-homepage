"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[client-error-boundary] app", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center lg:px-8">
      <p className="text-sm font-semibold text-primary">오류가 발생했습니다</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        페이지를 불러오지 못했습니다
      </h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-muted">오류 코드: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-8 inline-flex h-11 items-center border border-primary bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        다시 시도
      </button>
    </div>
  );
}
