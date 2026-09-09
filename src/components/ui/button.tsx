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
  default:
    "bg-primary text-primary-foreground hover:bg-primary-dark active:bg-primary-dark disabled:hover:bg-primary disabled:active:bg-primary",
  secondary:
    "bg-secondary text-primary-dark hover:bg-secondary/80 active:bg-secondary/80 disabled:hover:bg-secondary disabled:active:bg-secondary",
  outline:
    "border border-border bg-card text-primary-dark hover:border-accent-purple hover:bg-secondary active:border-accent-purple active:bg-secondary disabled:hover:border-border disabled:hover:bg-card disabled:active:border-border disabled:active:bg-card",
  ghost:
    "text-primary-dark hover:bg-secondary active:bg-secondary disabled:hover:bg-transparent disabled:active:bg-transparent",
  inverse:
    "bg-white text-primary-dark hover:bg-gold active:bg-gold disabled:hover:bg-white disabled:active:bg-white",
  inverseOutline:
    "border border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white active:bg-white/10 disabled:hover:bg-transparent disabled:active:bg-transparent",
  link:
    "h-auto rounded-none px-0 text-primary-dark underline-offset-4 hover:underline active:underline",
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  default: "h-11 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  xl: "h-12 px-6 text-sm",
  icon: "h-11 w-11 p-0",
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
    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
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
