import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type HelpTooltipProps = {
  className?: string;
  label: string;
  message: ReactNode;
};

/**
 * 짧은 정보 아이콘으로 보조 설명을 접어두고 hover, focus, touch에서 노출합니다.
 */
export function HelpTooltip({ className, label, message }: HelpTooltipProps) {
  return (
    <span className="group/help relative inline-flex">
      <button
        type="button"
        className="text-muted hover:text-foreground focus-visible:outline-primary inline-flex size-5 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={label}
      >
        <Info size={14} aria-hidden="true" />
      </button>
      <span
        className={cn(
          "border-border bg-card text-foreground pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-56 rounded-lg border px-3 py-2 text-xs leading-relaxed shadow-lg group-focus-within/help:block group-hover/help:block",
          className,
        )}
      >
        {message}
      </span>
    </span>
  );
}
