"use client";

import { useActionState } from "react";
import { PendingButton } from "@/components/ui/pending-button";
import { deleteInquiry } from "./actions";

export function DeleteInquiryButton({ id }: { id: number }) {
  const [state, action] = useActionState(deleteInquiry, { message: "" });
  return (
    <form action={action} onSubmit={(event) => {
      if (!window.confirm(`문의 ${id}번과 본문을 포함한 모든 개인정보를 영구 삭제하시겠습니까? 복구할 수 없습니다.`)) event.preventDefault();
    }}>
      <input type="hidden" name="id" value={id} />
      <PendingButton pendingLabel="삭제 중…" className="border border-red-700 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">영구 삭제</PendingButton>
      {state.message && <p role="alert" className="mt-2 text-sm text-red-700">{state.message}</p>}
    </form>
  );
}
