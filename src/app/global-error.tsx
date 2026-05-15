"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[client-error-boundary] global", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <main
          style={{
            alignItems: "center",
            display: "flex",
            minHeight: "100vh",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <p>오류가 발생했습니다</p>
            <h1>페이지를 불러오지 못했습니다</h1>
            <p>잠시 후 다시 시도해주세요.</p>
            {error.digest ? <p>오류 코드: {error.digest}</p> : null}
            <button type="button" onClick={() => unstable_retry()}>
              다시 시도
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
