import type { MatchCreateStep } from "@/features/match-create/model/matchDraft";

type Props = {
  onStepChange: (step: MatchCreateStep) => void;
  step: MatchCreateStep;
};

/**
 * 경기 생성 wizard의 단계를 버튼으로 제공한다.
 *
 * 모든 단계는 클릭 가능하며, 아직 준비되지 않은 단계는 이동 후 guard 패널에서
 * 필요한 이전 작업을 안내한다.
 */
export function MatchCreateStepNav({ onStepChange, step }: Props) {
  return (
    <div className="bg-surface grid grid-cols-3 gap-1 rounded-2xl p-1 sm:gap-2">
      {STEP_ITEMS.map((item, index) => {
        const active = step === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onStepChange(item.key)}
            className={`rounded-xl px-2 py-3 text-center text-xs font-bold transition sm:px-4 sm:text-sm ${
              active ? "bg-card text-foreground shadow-sm" : "text-muted"
            }`}
            aria-current={active ? "step" : undefined}
          >
            <span
              className={`mr-1.5 sm:mr-2 ${
                active ? "text-primary" : "text-muted"
              }`}
            >
              {index + 1}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

const STEP_ITEMS: { key: MatchCreateStep; label: string }[] = [
  { key: "info", label: "경기 정보" },
  { key: "participants", label: "참가 명단" },
  { key: "adjustment", label: "출전 조정" },
];
