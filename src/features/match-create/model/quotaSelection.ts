import type { PlayerPositionCode } from "@/entities/position";

export type QuotaSelectionType = "increased" | "reduced";

type QuotaCandidate = {
  id: string;
  mainPosition: PlayerPositionCode;
  priorityRank: number;
};

/**
 * GK 고정 시 모든 쿼터에 배정할 골키퍼를 우선순위 기준으로 선택합니다.
 */
export function pickFixedGoalkeeper<T extends QuotaCandidate>(players: T[]) {
  return [...players].sort((a, b) => {
    const aIsGk = a.mainPosition === "GK";
    const bIsGk = b.mainPosition === "GK";

    if (aIsGk !== bIsGk) return aIsGk ? -1 : 1;

    return a.priorityRank - b.priorityRank;
  })[0];
}

/**
 * 쿼터 보정 계산에 참여할 선수 목록을 반환하고, GK 고정 시 고정 GK를 제외합니다.
 */
export function getQuotaPlayers<T extends QuotaCandidate>({
  gkFixed,
  players,
}: {
  gkFixed: boolean;
  players: T[];
}) {
  const fixedGoalkeeper = gkFixed ? pickFixedGoalkeeper(players) : undefined;

  return {
    fixedGoalkeeper,
    quotaPlayers: fixedGoalkeeper
      ? players.filter((player) => player.id !== fixedGoalkeeper.id)
      : players,
  };
}

/**
 * 쿼터 보정 계산에 사용할 쿼터당 슬롯 수를 반환하고, GK 고정 시 GK 슬롯을 제외합니다.
 */
export function getQuotaSlotsPerQuarter({
  gkFixed,
  slotsPerQuarter,
}: {
  gkFixed: boolean;
  slotsPerQuarter: number;
}) {
  return Math.max(slotsPerQuarter - (gkFixed ? 1 : 0), 0);
}

/**
 * 선택해야 하는 보정 대상이 많은 쿼터 대상인지 적은 쿼터 대상인지 결정합니다.
 */
export function getQuotaSelectionType({
  playerCount,
  quarterCount,
  slotsPerQuarter,
}: {
  playerCount: number;
  quarterCount: number;
  slotsPerQuarter: number;
}): QuotaSelectionType {
  if (playerCount === 0) return "reduced";

  const remainder = (quarterCount * slotsPerQuarter) % playerCount;
  const reducedCount = remainder === 0 ? 0 : playerCount - remainder;

  return remainder > 0 && remainder <= reducedCount ? "increased" : "reduced";
}

/**
 * UI에서 직접 선택받아야 하는 쿼터 보정 선수 수를 계산합니다.
 */
export function getQuotaSelectionCount({
  playerCount,
  quarterCount,
  slotsPerQuarter,
}: {
  playerCount: number;
  quarterCount: number;
  slotsPerQuarter: number;
}) {
  if (playerCount === 0) return 0;

  const remainder = (quarterCount * slotsPerQuarter) % playerCount;

  if (remainder === 0) return 0;

  const reducedCount = playerCount - remainder;
  return Math.min(remainder, reducedCount);
}

/**
 * 현재 우선순위와 선택 타입에 맞춰 기본 보정 대상 선수 id 집합을 만듭니다.
 */
export function getDefaultQuotaPlayerIds<T extends QuotaCandidate>({
  players,
  requiredCount,
  selectionType,
}: {
  players: T[];
  requiredCount: number;
  selectionType: QuotaSelectionType;
}) {
  return new Set(
    [...players]
      .sort((a, b) =>
        selectionType === "increased"
          ? a.priorityRank - b.priorityRank
          : b.priorityRank - a.priorityRank,
      )
      .slice(0, requiredCount)
      .map((player) => player.id),
  );
}

/**
 * UI 선택값을 서버 액션에 제출할 reducedPlayerIds로 변환합니다.
 */
export function getReducedPlayerIdsFromQuotaSelection<T extends QuotaCandidate>({
  quotaPlayerIds,
  selectedPlayers,
  selectionType,
}: {
  quotaPlayerIds: Set<string>;
  selectedPlayers: T[];
  selectionType: QuotaSelectionType;
}) {
  if (selectionType === "reduced") return [...quotaPlayerIds];

  return selectedPlayers
    .filter((player) => !quotaPlayerIds.has(player.id))
    .map((player) => player.id);
}

/**
 * 보정 대상 선수와 슬롯 수를 기준으로 서버 검증에 필요한 reduced quota 수를 계산합니다.
 */
export function getRequiredReducedPlayerCount({
  playerCount,
  quarterCount,
  slotsPerQuarter,
}: {
  playerCount: number;
  quarterCount: number;
  slotsPerQuarter: number;
}) {
  if (playerCount === 0) return 0;

  const remainder = (quarterCount * slotsPerQuarter) % playerCount;

  return remainder === 0 ? 0 : playerCount - remainder;
}
