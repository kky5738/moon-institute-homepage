"use client";

import { useActionState } from "react";
import { PendingButton } from "@/components/ui/pending-button";
import { deletePost, type PostFormState } from "./actions";

const initial: PostFormState = { status: "idle", message: "" };

export function DeletePostButton({ id, title }: { id: number; title: string }) {
  const [state, action] = useActionState(deletePost, initial);
  return (
    <form action={action} onSubmit={(event) => {
      if (!window.confirm(`“${title}” 게시글을 삭제하시겠습니까?`)) event.preventDefault();
    }}>
      <input type="hidden" name="id" value={id} />
      <PendingButton pendingLabel="삭제 중…" className="inline-flex h-9 items-center border border-border bg-surface px-3 text-xs font-semibold text-red-700 hover:border-red-700 disabled:opacity-50">
        삭제
      </PendingButton>
      {state.message && <p role="alert" className="mt-2 text-sm text-red-700">{state.message}</p>}
    </form>
  );
}
