import {
  formatPlayerName,
  formatPositions,
} from "@/features/match-create/lib/playerFormat";
import type { MatchCreateParticipant } from "@/features/match-create/model/types";
import type { PlaytimeAdjustmentType } from "@/features/match-create/model/matchDraftSelectors";

type Props = {
  adjustmentType: PlaytimeAdjustmentType;
  baseQuarterCount: number;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  player: MatchCreateParticipant;
};

/**
 * 출전 시간이 균등하게 나뉘지 않는 선수 후보 한 명을 선택하는 카드다.
 *
 * 선택 전후의 예상 쿼터 수를 같이 보여줘 사용자가 “왜 이 선수를 고르는지”를
 * 카드 안에서 바로 판단할 수 있게 한다.
 */
export function AdjustmentPlayerCard({
  adjustmentType,
  baseQuarterCount,
  checked,
  disabled,
  onToggle,
  player,
}: Props) {
  const selectedQuarterCount =
    adjustmentType === "more" ? baseQuarterCount + 1 : baseQuarterCount;
  const defaultQuarterCount =
    adjustmentType === "more" ? baseQuarterCount : baseQuarterCount + 1;

  return (
    <label
      className={`relative min-h-24 rounded-lg border p-3 transition ${
        checked ? "border-primary bg-mint-surface" : "border-border bg-card"
      } ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-3 bottom-3 left-0 w-1 rounded-r-full ${
          checked ? "bg-primary" : "bg-transparent"
        }`}
      />
      <span className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          className="accent-primary mt-0.5 size-4"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="text-foreground block truncate text-sm font-semibold">
                {formatPlayerName(player)}
              </span>
              <span className="text-muted mt-1 block text-xs">
                {formatPositions(player)}
              </span>
            </span>
          </span>
          <span className="text-muted mt-3 block text-xs">
            기본 {defaultQuarterCount}쿼터 · 선택 시 {selectedQuarterCount}쿼터
          </span>
        </span>
      </span>
    </label>
  );
}
