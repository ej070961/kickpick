import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  error?: string;
  label: ReactNode;
};

/**
 * 경기 정보 입력 필드의 label, control, error 위치를 통일합니다.
 */
export function FieldShell({
  children,
  className = "",
  error,
  label,
}: Props) {
  return (
    <label className={`block ${className}`}>
      <span className="text-foreground text-sm font-medium">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error && (
        <span className="text-mismatch mt-1 block text-xs">{error}</span>
      )}
    </label>
  );
}

export const FIELD_CONTROL_CLASS =
  "border-border focus:border-primary min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none";
