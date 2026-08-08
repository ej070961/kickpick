import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type PanelProps = HTMLAttributes<HTMLElement> & {
  actions?: ReactNode;
  description?: ReactNode;
  title?: ReactNode;
};

/**
 * 폼 섹션, 편집 패널, 요약 영역에 쓰는 공통 카드형 컨테이너입니다.
 */
export function Panel({
  actions,
  children,
  className,
  description,
  title,
  ...props
}: PanelProps) {
  return (
    <section
      className={cn(
        "border-border bg-card rounded-lg border p-4 shadow-sm",
        className,
      )}
      {...props}
    >
      {title || description || actions ? (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h3 className="text-foreground text-base font-semibold">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="text-muted mt-1 text-sm">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
