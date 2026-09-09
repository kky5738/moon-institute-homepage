"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type PendingButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "disabled" | "type"
> & {
  children: ReactNode;
  disabled?: boolean;
  pendingLabel: ReactNode;
};

export function PendingButton({
  children,
  disabled = false,
  pendingLabel,
  ...props
}: PendingButtonProps) {
  const { data, pending } = useFormStatus();
  const isSubmitted = isPendingSubmitter({
    data,
    name: props.name,
    pending,
    value: props.value,
  });

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={isSubmitted || undefined}
      aria-live="polite"
      {...props}
    >
      {isSubmitted ? pendingLabel : children}
    </button>
  );
}

export function isPendingSubmitter({
  data,
  name,
  pending,
  value,
}: {
  data: FormData | null;
  name: string | undefined;
  pending: boolean;
  value: string | number | readonly string[] | undefined;
}) {
  if (!pending) return false;
  if (!name) return true;
  if (typeof value !== "string" && typeof value !== "number") return false;
  return data?.get(name) === String(value);
}
