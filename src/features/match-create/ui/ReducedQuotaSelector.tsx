"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import {
  formatPlayerName,
  formatPositions,
} from "@/features/match-create/lib/playerFormat";
import type { MatchCreateParticipant } from "@/features/match-create/model/types";
import type { QuotaSelectionType } from "@/features/match-create/model/quotaSelection";

type ReducedQuotaSelectorProps = {
  formationLabel: string;
  gkFixed: boolean;
  onQuotaPlayerIdsChange: (playerIds: Set<string>) => void;
  quarterCount: number;
  quotaPlayerIds: Set<string>;
  quotaSelectionType: QuotaSelectionType;
  requiredCount: number;
  selectedPlayers: MatchCreateParticipant[];
  slotsPerQuarter: number;
};

/**
 * 계산된 필요 인원 수에 맞춰 쿼터 보정 대상자를 선택하는 섹션입니다.
 */
export function ReducedQuotaSelector({
  formationLabel,
  gkFixed,
  onQuotaPlayerIdsChange,
  quarterCount,
  quotaPlayerIds,
  quotaSelectionType,
  requiredCount,
  selectedPlayers,
  slotsPerQuarter,
}: ReducedQuotaSelectorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const selectedCount = quotaPlayerIds.size;
  const disabled = requiredCount === 0 || selectedPlayers.length === 0;
  const totalSlots = quarterCount * slotsPerQuarter;
  const baseQuota =
    selectedPlayers.length > 0
      ? Math.floor(totalSlots / selectedPlayers.length)
      : 0;
  const increasedPlayerCount =
    selectedPlayers.length > 0 ? totalSlots % selectedPlayers.length : 0;
  const reducedPlayerCount =
    increasedPlayerCount === 0
      ? 0
      : selectedPlayers.length - increasedPlayerCount;
  const title =
    quotaSelectionType === "increased" ? "많은 쿼터 배정" : "적은 쿼터 배정";
  const description =
    quotaSelectionType === "increased"
      ? "다른 선수보다 1쿼터 더 뛰는 선수를 선택합니다."
      : "다른 선수보다 1쿼터 덜 뛰는 선수를 선택합니다.";
  const emptyMessage =
    requiredCount === 0
      ? "모든 선수가 동일한 쿼터 수로 배정됩니다."
      : "참가 선수가 없습니다.";
  const quotaSummary =
    increasedPlayerCount === 0
      ? `이번 경기에서는 모두 ${baseQuota}쿼터씩 뛰어요.`
      : `${increasedPlayerCount}명은 ${baseQuota + 1}쿼터, ${reducedPlayerCount}명은 ${baseQuota}쿼터를 뛰어요.`;
  const helpMessage =
    quotaSelectionType === "increased"
      ? `경기 시간을 최대한 공평하게 나누기 위해 더 뛰는 선수 ${requiredCount}명을 골라주세요. ${quotaSummary}`
      : `경기 시간을 최대한 공평하게 나누기 위해 덜 뛰는 선수 ${requiredCount}명을 골라주세요. ${quotaSummary}`;
  const helpId = "quota-selection-help";

  /**
   * 선택 가능 수를 넘지 않는 범위에서 보정 대상 선수 선택을 토글합니다.
   */
  function toggleQuotaPlayer(playerId: string) {
    const next = new Set(quotaPlayerIds);

    if (next.has(playerId)) {
      next.delete(playerId);
    } else if (next.size < requiredCount) {
      next.add(playerId);
    }

    onQuotaPlayerIdsChange(next);
  }

  return (
    <section className="border-border bg-card rounded-lg border p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-1">
            <h3 className="text-foreground text-base font-semibold">{title}</h3>
            <span
              className="relative inline-flex"
              onMouseEnter={() => setIsHelpOpen(true)}
              onMouseLeave={() => setIsHelpOpen(false)}
            >
              <button
                type="button"
                aria-label="쿼터 보정 설명"
                aria-describedby={isHelpOpen ? helpId : undefined}
                aria-expanded={isHelpOpen}
                onClick={() => setIsHelpOpen((current) => !current)}
                onFocus={() => setIsHelpOpen(true)}
                onBlur={() => setIsHelpOpen(false)}
                className="text-muted hover:bg-mint-surface hover:text-primary focus-visible:outline-primary inline-flex size-7 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Info size={16} aria-hidden="true" />
              </button>
              {isHelpOpen ? (
                <span
                  id={helpId}
                  role="tooltip"
                  className="border-border bg-card text-foreground absolute top-9 left-0 z-20 w-76 rounded-lg border px-3 py-2 text-xs leading-relaxed font-medium shadow-lg sm:left-1/2 sm:-translate-x-1/2"
                >
                  {helpMessage}
                  {gkFixed ? (
                    <span className="text-muted mt-1 block">
                      GK 고정 시 골키퍼와 GK 슬롯은 이 계산에서 제외돼요.
                    </span>
                  ) : null}
                </span>
              ) : null}
            </span>
          </div>
          <p className="text-muted mt-1 text-sm">{description}</p>
        </div>
        <p
          className={`text-sm font-semibold ${
            selectedCount === requiredCount ? "text-primary" : "text-mismatch"
          }`}
        >
          {selectedCount} / {requiredCount}명
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <div className="border-border bg-background rounded-lg border px-3 py-2">
          <p className="text-muted text-xs font-medium">포메이션</p>
          <p className="text-foreground mt-1 text-sm font-bold">
            {formationLabel}
          </p>
        </div>
        <div className="border-border bg-background rounded-lg border px-3 py-2">
          <p className="text-muted text-xs font-medium">쿼터</p>
          <p className="text-foreground mt-1 text-sm font-bold">
            {quarterCount}개
          </p>
        </div>
        <div className="border-border bg-background rounded-lg border px-3 py-2">
          <p className="text-muted text-xs font-medium">보정 대상</p>
          <p className="text-foreground mt-1 text-sm font-bold">
            {selectedPlayers.length}명
          </p>
        </div>
        <div className="border-border bg-background rounded-lg border px-3 py-2">
          <p className="text-muted text-xs font-medium">GK</p>
          <p className="text-foreground mt-1 text-sm font-bold">
            {gkFixed ? "고정" : "자동"}
          </p>
        </div>
      </div>

      {disabled ? (
        <p className="border-border text-muted mt-4 rounded-lg border border-dashed p-4 text-sm">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {selectedPlayers.map((player) => {
            const checked = quotaPlayerIds.has(player.id);
            const selectionBlocked = !checked && selectedCount >= requiredCount;

            return (
              <label
                key={player.id}
                className={`rounded-lg border p-3 transition ${
                  checked
                    ? "border-primary bg-mint-surface"
                    : "border-border bg-card"
                } ${
                  selectionBlocked
                    ? "cursor-not-allowed opacity-45"
                    : "cursor-pointer"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={selectionBlocked}
                    onChange={() => toggleQuotaPlayer(player.id)}
                    className="accent-primary mt-0.5 size-4"
                  />
                  <span className="min-w-0">
                    <span className="text-foreground block text-sm font-semibold">
                      {formatPlayerName(player)}
                    </span>
                    {player.isGuest ? (
                      <span className="border-primary/35 bg-card text-primary mt-1 inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold">
                        용병
                      </span>
                    ) : null}
                    <span className="text-muted mt-1 block text-xs">
                      #{player.priorityRank} / {formatPositions(player)}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}
