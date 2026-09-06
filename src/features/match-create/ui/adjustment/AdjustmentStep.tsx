"use client";

import { HelpTooltip } from "@/shared/ui";
import type { MatchDraftSummary } from "@/features/match-create/model/matchDraftSelectors";
import { MatchCreateStepPanel } from "../MatchCreateStepPanel";
import { AdjustmentPlayerCard } from "./AdjustmentPlayerCard";
import { AdjustmentSummary } from "./AdjustmentSummary";

type Props = {
  gkFixed: boolean;
  onPlaytimeAdjustmentPlayersChange: (playerIds: string[]) => void;
  playtimeAdjustmentPlayerIds: string[];
  quarterCount: number;
  stateError?: string;
  summary: MatchDraftSummary;
};

/**
 * 인원이 쿼터 슬롯에 딱 나누어떨어지지 않을 때 출전 시간을 조정하는 마지막 단계다.
 *
 * 사용자는 내부 출전 수 계산을 몰라도, 더 뛰거나 덜 뛸 선수만 선택하면 된다.
 */
export function AdjustmentStep({
  gkFixed,
  onPlaytimeAdjustmentPlayersChange,
  playtimeAdjustmentPlayerIds,
  quarterCount,
  stateError,
  summary,
}: Props) {
  const selectedPlayerIdSet = new Set(playtimeAdjustmentPlayerIds);
  const totalSlots = quarterCount * summary.playtimeSlotsPerQuarter;
  const baseQuarterCount =
    summary.playtimeAdjustmentCandidates.length > 0
      ? Math.floor(totalSlots / summary.playtimeAdjustmentCandidates.length)
      : 0;
  const title =
    summary.playtimeAdjustmentType === "more"
      ? "1쿼터 더 뛸 선수를 골라주세요."
      : "1쿼터 덜 뛸 선수를 골라주세요.";
  const helpMessage =
    summary.playtimeAdjustmentType === "more"
      ? `경기 시간을 최대한 공평하게 나누기 위해 ${summary.requiredPlaytimeAdjustmentCount}명을 더 뛰는 선수로 골라요.`
      : `경기 시간을 최대한 공평하게 나누기 위해 ${summary.requiredPlaytimeAdjustmentCount}명을 덜 뛰는 선수로 골라요.`;

  function togglePlayer(playerId: string) {
    const next = new Set(playtimeAdjustmentPlayerIds);

    if (next.has(playerId)) {
      next.delete(playerId);
    } else if (next.size < summary.requiredPlaytimeAdjustmentCount) {
      next.add(playerId);
    }

    onPlaytimeAdjustmentPlayersChange([...next]);
  }

  return (
    <MatchCreateStepPanel
      title="출전 조정"
      description="인원이 딱 나누어떨어지지 않을 때, 더 뛰거나 덜 뛸 선수를 정해요."
      contentClassName="mt-4"
    >
      <AdjustmentSummary
        gkFixed={gkFixed}
        quarterCount={quarterCount}
        summary={summary}
      />

      <AdjustmentContent
        baseQuarterCount={baseQuarterCount}
        gkFixed={gkFixed}
        helpMessage={helpMessage}
        onTogglePlayer={togglePlayer}
        playtimeAdjustmentPlayerIds={playtimeAdjustmentPlayerIds}
        selectedPlayerIdSet={selectedPlayerIdSet}
        summary={summary}
        title={title}
      />

      {stateError && (
        <span className="text-mismatch mt-3 block text-xs">{stateError}</span>
      )}
    </MatchCreateStepPanel>
  );
}

function AdjustmentContent({
  baseQuarterCount,
  gkFixed,
  helpMessage,
  onTogglePlayer,
  playtimeAdjustmentPlayerIds,
  selectedPlayerIdSet,
  summary,
  title,
}: {
  baseQuarterCount: number;
  gkFixed: boolean;
  helpMessage: string;
  onTogglePlayer: (playerId: string) => void;
  playtimeAdjustmentPlayerIds: string[];
  selectedPlayerIdSet: Set<string>;
  summary: MatchDraftSummary;
  title: string;
}) {
  if (summary.requiredPlaytimeAdjustmentCount === 0) {
    return (
      <p className="border-border text-muted mt-4 rounded-lg border border-dashed p-4 text-sm">
        이번 경기는 모두 같은 쿼터 수로 뛸 수 있어요.
      </p>
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-foreground text-sm font-semibold">{title}</p>
          <HelpTooltip
            label="출전 조정 설명"
            message={
              <>
                {helpMessage}
                {gkFixed && (
                  <span className="text-muted mt-1 block">
                    고정 골키퍼와 GK 슬롯은 이 계산에서 따로 처리돼요.
                  </span>
                )}
              </>
            }
          />
        </div>
        <PlaytimeAdjustmentCount
          selectedCount={playtimeAdjustmentPlayerIds.length}
          requiredCount={summary.requiredPlaytimeAdjustmentCount}
        />
      </div>

      <AdjustmentPlayerList
        baseQuarterCount={baseQuarterCount}
        onTogglePlayer={onTogglePlayer}
        playtimeAdjustmentPlayerIds={playtimeAdjustmentPlayerIds}
        selectedPlayerIdSet={selectedPlayerIdSet}
        summary={summary}
      />
    </>
  );
}

function PlaytimeAdjustmentCount({
  requiredCount,
  selectedCount,
}: {
  requiredCount: number;
  selectedCount: number;
}) {
  const isComplete = selectedCount === requiredCount;

  return (
    <p
      className={`text-sm font-semibold ${
        isComplete ? "text-primary" : "text-mismatch"
      }`}
    >
      {selectedCount} / {requiredCount}명
    </p>
  );
}

function AdjustmentPlayerList({
  baseQuarterCount,
  onTogglePlayer,
  playtimeAdjustmentPlayerIds,
  selectedPlayerIdSet,
  summary,
}: {
  baseQuarterCount: number;
  onTogglePlayer: (playerId: string) => void;
  playtimeAdjustmentPlayerIds: string[];
  selectedPlayerIdSet: Set<string>;
  summary: MatchDraftSummary;
}) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {summary.playtimeAdjustmentCandidates.map((player) => {
        const checked = selectedPlayerIdSet.has(player.id);
        const disabled =
          !checked &&
          playtimeAdjustmentPlayerIds.length >=
            summary.requiredPlaytimeAdjustmentCount;

        return (
          <AdjustmentPlayerCard
            key={player.id}
            adjustmentType={summary.playtimeAdjustmentType}
            baseQuarterCount={baseQuarterCount}
            checked={checked}
            disabled={disabled}
            player={player}
            onToggle={() => onTogglePlayer(player.id)}
          />
        );
      })}
    </div>
  );
}
