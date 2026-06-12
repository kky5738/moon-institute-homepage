import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "inverse"
  | "inverseOutline"
  | "link";

type ButtonSize = "sm" | "default" | "lg" | "xl" | "icon";

const variantClassNames: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary-dark",
  secondary: "bg-secondary text-primary-dark hover:bg-secondary/80",
  outline:
    "border border-border bg-card text-primary-dark hover:border-accent-purple hover:bg-secondary",
  ghost: "text-primary-dark hover:bg-secondary",
  inverse: "bg-white text-primary-dark hover:bg-gold",
  inverseOutline:
    "border border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white",
  link: "h-auto rounded-none px-0 text-primary-dark underline-offset-4 hover:underline",
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  default: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  xl: "h-12 px-6 text-sm",
  icon: "h-10 w-10 p-0",
};

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    variantClassNames[variant],
    variant === "link" ? "" : sizeClassNames[size],
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
