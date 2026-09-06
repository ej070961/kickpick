import type { MatchCreateStep } from "@/features/match-create/model/matchDraft";
import type { StepAccess } from "@/features/match-create/model/matchDraftSelectors";

type Props = {
  onStepChange: (step: MatchCreateStep) => void;
  stepAccess: StepAccess[MatchCreateStep];
};

/**
 * 아직 준비되지 않은 단계에 들어왔을 때 막힌 이유와 돌아갈 단계를 안내한다.
 */
export function MatchCreateStepGuard({ onStepChange, stepAccess }: Props) {
  if (stepAccess.canEnter) return null;

  return (
    <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
      <p className="text-foreground text-base font-semibold">
        {stepAccess.title ?? "이전 단계를 먼저 확인해주세요."}
      </p>
      <p className="text-muted mt-1 text-sm leading-6">{stepAccess.message}</p>
      {stepAccess.requiredStep && (
        <button
          type="button"
          onClick={() => onStepChange(stepAccess.requiredStep!)}
          className="bg-primary text-primary-foreground mt-4 inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold"
        >
          {STEP_LABELS[stepAccess.requiredStep]}로 이동
        </button>
      )}
    </div>
  );
}

const STEP_LABELS: Record<MatchCreateStep, string> = {
  adjustment: "출전 조정",
  info: "경기 정보",
  participants: "참가 명단",
};
