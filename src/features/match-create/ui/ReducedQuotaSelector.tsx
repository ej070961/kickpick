import { formatPlayerName, formatPositions } from "@/features/match-create/lib/playerFormat";
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
  const selectedCount = quotaPlayerIds.size;
  const disabled = requiredCount === 0 || selectedPlayers.length === 0;
  const totalSlots = quarterCount * slotsPerQuarter;
  const baseQuota =
    selectedPlayers.length > 0 ? Math.floor(totalSlots / selectedPlayers.length) : 0;
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
  const calculationMessage =
    increasedPlayerCount === 0
      ? `총 ${totalSlots}자리를 ${selectedPlayers.length}명이 나누어 모든 선수가 ${baseQuota}쿼터씩 뜁니다.`
      : `총 ${totalSlots}자리를 ${selectedPlayers.length}명이 나누어 ${increasedPlayerCount}명은 ${baseQuota + 1}쿼터, ${reducedPlayerCount}명은 ${baseQuota}쿼터를 뜁니다.`;
  const selectionReason =
    quotaSelectionType === "increased"
      ? `선택 수가 더 적은 ${increasedPlayerCount}명의 많은 쿼터 배정 선수를 고릅니다.`
      : `선택 수가 더 적은 ${reducedPlayerCount}명의 적은 쿼터 배정 선수를 고릅니다.`;

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
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {description}
          </p>
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
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs font-medium text-muted">포메이션</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {formationLabel}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs font-medium text-muted">쿼터</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {quarterCount}개
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs font-medium text-muted">보정 대상</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {selectedPlayers.length}명
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs font-medium text-muted">GK</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {gkFixed ? "고정" : "자동"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          {calculationMessage}
        </p>
        {requiredCount > 0 ? (
          <p className="mt-1 text-xs text-muted">{selectionReason}</p>
        ) : null}
        {gkFixed ? (
          <p className="mt-1 text-xs text-muted">
            GK 고정 시 골키퍼와 GK 슬롯은 쿼터 보정 계산에서 제외됩니다.
          </p>
        ) : null}
      </div>

      {disabled ? (
        <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted">
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
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {formatPlayerName(player)}
                    </span>
                    {player.isGuest ? (
                      <span className="mt-1 inline-flex rounded-md border border-primary/35 bg-card px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        용병
                      </span>
                    ) : null}
                    <span className="mt-1 block text-xs text-muted">
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
