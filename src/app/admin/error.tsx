"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[client-error-boundary] admin", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center lg:px-8">
      <p className="text-sm font-semibold text-stone-700">관리자 오류</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">
        관리자 화면을 불러오지 못했습니다
      </h1>
      <p className="mt-4 text-sm leading-6 text-neutral-600">
        인증 설정 또는 데이터베이스 연결을 확인해주세요.
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-neutral-400">오류 코드: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-8 inline-flex h-11 items-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
      >
        다시 시도
      </button>
    </div>
  );
}
