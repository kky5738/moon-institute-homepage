import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "accent" | "gold";

const variantClassNames: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary-dark",
  secondary: "bg-secondary text-primary-dark",
  outline: "border border-border bg-card text-primary-dark",
  accent: "bg-accent-purple/10 text-accent-purple",
  gold: "bg-gold/15 text-[color:var(--gold)]",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold",
        variantClassNames[variant],
        className,
      )}
      {...props}
    />
  );
}
