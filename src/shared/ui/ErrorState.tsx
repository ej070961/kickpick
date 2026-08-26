import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type ErrorStateProps = {
  action?: ReactNode;
  description?: string;
  title: string;
};

/**
 * 화면 단위 오류 또는 복구 불가능한 빈 상태를 일관된 패널로 표시합니다.
 */
export function ErrorState({ action, description, title }: ErrorStateProps) {
  return (
    <div
      className="border-mismatch/30 bg-card rounded-lg border p-6 text-center shadow-sm"
      role="status"
    >
      <div className="bg-mismatch/10 text-mismatch mx-auto flex size-10 items-center justify-center rounded-full">
        <TriangleAlert size={22} aria-hidden="true" />
      </div>
      <h2 className="text-foreground mt-3 text-base font-semibold">{title}</h2>
      {description ? (
        <p className="text-muted mx-auto mt-2 max-w-md text-sm">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
