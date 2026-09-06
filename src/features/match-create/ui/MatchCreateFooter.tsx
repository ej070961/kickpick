import { CalendarPlus } from "lucide-react";
import type { MatchCreateStep } from "@/features/match-create/model/matchDraft";
import { SubmitButton } from "@/features/player-manage/ui/SubmitButton";

type Props = {
  canSubmit: boolean;
  onStepChange: (step: MatchCreateStep) => void;
  step: MatchCreateStep;
};

/**
 * 경기 생성 wizard 하단의 이전, 다음, 제출 액션을 단계별로 렌더링한다.
 */
export function MatchCreateFooter({ canSubmit, onStepChange, step }: Props) {
  return (
    <div className="border-border bg-background/95 sticky bottom-0 -mx-4 flex flex-col gap-2 border-t px-4 py-3 backdrop-blur sm:flex-row sm:justify-end lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
      <FooterActions
        canSubmit={canSubmit}
        step={step}
        onStepChange={onStepChange}
      />
    </div>
  );
}

function FooterActions({ canSubmit, onStepChange, step }: Props) {
  if (step === "info") {
    return (
      <button
        type="button"
        onClick={() => onStepChange("participants")}
        className="bg-primary text-primary-foreground inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold sm:w-auto"
      >
        다음
      </button>
    );
  }

  if (step === "participants") {
    return (
      <>
        <button
          type="button"
          onClick={() => onStepChange("info")}
          className="border-border bg-card text-foreground inline-flex min-h-11 w-full items-center justify-center rounded-lg border px-4 text-sm font-semibold sm:w-auto"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => onStepChange("adjustment")}
          className="bg-primary text-primary-foreground inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold sm:w-auto"
        >
          다음
        </button>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onStepChange("participants")}
        className="border-border bg-card text-foreground inline-flex min-h-11 w-full items-center justify-center rounded-lg border px-4 text-sm font-semibold sm:w-auto"
      >
        이전
      </button>
      <SubmitButton
        className="bg-primary text-primary-foreground inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-60 sm:w-auto"
        disabled={!canSubmit}
        pendingLabel="생성 중"
      >
        <CalendarPlus size={18} aria-hidden="true" />
        라인업 만들기
      </SubmitButton>
    </>
  );
}
