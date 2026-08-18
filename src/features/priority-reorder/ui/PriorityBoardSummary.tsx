"use client";

import { LoaderCircle, Save } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

type Props = {
  isDirty: boolean;
  isPending: boolean;
  onSave: () => void;
  playerCount: number;
  statusMessage: string | null;
};

/**
 * 선수 우선순위 보드의 목록 요약과 저장 상태를 렌더링합니다.
 */
export function PriorityBoardSummary({
  isDirty,
  isPending,
  onSave,
  playerCount,
  statusMessage,
}: Props) {
  const messageClassName = cn(
    "mt-1 text-sm",
    statusMessage ? getStatusMessageClassName(isDirty) : "text-muted",
  );

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-foreground text-base font-semibold">
          등록 선수 {playerCount}명
        </p>
        <p className={messageClassName}>
          {statusMessage ?? "위에 있을수록 자동 배치에서 먼저 고려돼요."}
        </p>
      </div>
      <Button
        disabled={!isDirty || isPending}
        leftIcon={<SaveButtonIcon isPending={isPending} />}
        onClick={onSave}
      >
        순서 저장
      </Button>
    </div>
  );
}

function getStatusMessageClassName(isDirty: boolean) {
  return cn(isDirty && "text-mismatch", !isDirty && "text-primary");
}

function SaveButtonIcon({ isPending }: Pick<Props, "isPending">) {
  if (isPending) {
    return (
      <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
    );
  }

  return <Save size={18} aria-hidden="true" />;
}
