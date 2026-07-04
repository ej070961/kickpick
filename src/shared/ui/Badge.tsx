import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type BadgeVariant = "default" | "primary" | "warning" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

/**
 * 짧은 상태, 포지션, 카운트 정보를 일관된 chip 형태로 표시합니다.
 */
export function Badge({
  children,
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-bold",
        BADGE_VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const BADGE_VARIANT_CLASS: Record<BadgeVariant, string> = {
  danger: "bg-orange-50 text-mismatch",
  default: "border border-border bg-background text-muted",
  primary: "bg-mint-surface text-primary",
  warning: "bg-warning/20 text-foreground",
};
