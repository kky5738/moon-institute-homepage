"use client";

import { useActionState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { PendingButton } from "@/components/ui/pending-button";

type FormState = { message: string; status: "idle" | "error" | "success" };

const initialState: FormState = { message: "", status: "idle" };

export function PendingButtonIntegrationTest() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-5 py-14">
      <div>
        <p className="text-sm font-semibold text-primary">개발 전용 검증</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">
          제출 버튼 상태
        </h1>
      </div>
      <MockForm
        title="게시글 작업"
        row="post"
        buttons={[
          ["draft", "임시저장", "저장 중…"],
          ["publish", "공개하기", "공개 중…"],
          ["fail", "실패 테스트", "실패 처리 중…"],
        ]}
      />
      <MockForm
        title="회원 상태"
        row="member"
        buttons={[
          ["approve", "승인", "승인 중…"],
          ["disable", "비활성화", "비활성화 중…"],
        ]}
      />
      <MockForm
        title="다른 회원 상태"
        row="other-member"
        buttons={[
          ["approve", "승인", "승인 중…"],
          ["disable", "비활성화", "비활성화 중…"],
        ]}
      />
    </main>
  );
}

function MockForm({
  title,
  row,
  buttons,
}: {
  title: string;
  row: string;
  buttons: Array<[string, string, string]>;
}) {
  const [state, formAction] = useActionState(submitMock, initialState);

  return (
    <section className="border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">{title}</h2>
      <form action={formAction} className="mt-4 flex flex-wrap gap-3">
        <input type="hidden" name="row" value={row} />
        {buttons.map(([value, label, pendingLabel]) => (
          <PendingButton
            key={value}
            name="intent"
            value={value}
            pendingLabel={pendingLabel}
            data-testid={`${row}-${value}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {label}
          </PendingButton>
        ))}
      </form>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className="mt-3 text-sm text-muted"
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}

async function submitMock(_previous: FormState, formData: FormData): Promise<FormState> {
  await new Promise((resolve) => window.setTimeout(resolve, 800));
  const intent = String(formData.get("intent"));

  if (intent === "fail") {
    return { status: "error", message: "실패 후 다시 시도할 수 있습니다." };
  }

  return { status: "success", message: `${intent} 처리 완료` };
}
