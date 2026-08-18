import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type ButtonVariant =
  "primary" | "secondary" | "danger" | "dangerSolid" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  leftIcon?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

/**
 * 앱 전반에서 사용하는 버튼 스타일 변형을 제공합니다.
 */
export function Button({
  children,
  className,
  leftIcon,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON_SIZE_CLASS[size],
        BUTTON_VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  );
}

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  md: "min-h-11 px-4",
  sm: "min-h-9 px-3",
};

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  danger:
    "border border-mismatch/45 text-mismatch hover:border-mismatch hover:bg-orange-50",
  dangerSolid: "bg-mismatch text-white hover:opacity-90",
  ghost: "text-muted hover:bg-surface hover:text-foreground",
  primary: "bg-primary text-primary-foreground",
  secondary: "border border-border bg-card text-foreground hover:bg-surface",
};
