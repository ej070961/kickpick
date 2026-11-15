import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type FieldShellProps = {
  children: ReactNode;
  error?: string;
  hideLabel?: boolean;
  label: ReactNode;
};

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: ReactNode;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  hideLabel?: boolean;
  label: ReactNode;
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
function FieldShell({ children, error, hideLabel, label }: FieldShellProps) {
  return (
    <label className="block">
      <span
        className={
          hideLabel ? "sr-only" : "text-foreground text-sm font-semibold"
        }
      >
        {label}
      </span>
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
  hideLabel = false,
  label,
  multiple,
  size,
  ...props
}: SelectFieldProps) {
  const hasChevron = !multiple && (size ?? 1) <= 1;

  return (
    <FieldShell error={error} hideLabel={hideLabel} label={label}>
      <span className={cn("relative block", !hideLabel && "mt-2")}>
        <select
          className={cn(
            "border-border bg-background text-foreground focus:border-primary block min-h-11 w-full rounded-lg border px-3 text-sm font-semibold transition",
            hasChevron && "appearance-none pr-9 forced-colors:appearance-auto",
            className,
          )}
          multiple={multiple}
          size={size}
          {...props}
        >
          {children}
        </select>
        {hasChevron && (
          <ChevronDown
            aria-hidden="true"
            className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 forced-colors:hidden"
            size={16}
          />
        )}
      </span>
    </FieldShell>
  );
}
