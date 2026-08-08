import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/shared/lib/cn";

type FieldShellProps = {
  children: ReactNode;
  error?: string;
  label: string;
};

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  label: string;
};

/**
 * 단일 행 텍스트/숫자 입력에 쓰는 공통 입력 컴포넌트입니다.
 */
export function TextField({
  className,
  error,
  label,
  ...props
}: TextFieldProps) {
  return (
    <FieldShell error={error} label={label}>
      <input
        className={cn(
          "border-border bg-background text-foreground focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none",
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
}

/**
 * label, control, error 간격을 통일하는 필드 래퍼입니다.
 */
function FieldShell({ children, error, label }: FieldShellProps) {
  return (
    <label className="block">
      <span className="text-foreground text-sm font-semibold">{label}</span>
      {children}
      {error ? (
        <span className="text-mismatch mt-1 block text-xs">{error}</span>
      ) : null}
    </label>
  );
}

/**
 * 단일 선택 입력에 쓰는 공통 select 컴포넌트입니다.
 */
export function SelectField({
  children,
  className,
  error,
  label,
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell error={error} label={label}>
      <select
        className={cn(
          "border-border bg-background text-foreground focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm font-semibold transition outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
