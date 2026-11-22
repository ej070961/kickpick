import type { PlayerPositionCode } from "@/entities/position";

type QuotaCandidate = {
  id: string;
  mainPosition: PlayerPositionCode;
  priorityRank: number;
};

/** 골키퍼 고정 시 우선순위가 가장 높은 골키퍼를 선택합니다. */
export const pickFixedGoalkeeper = <T extends QuotaCandidate>(players: T[]) => {
  return players
    .filter((player) => player.mainPosition === "GK")
    .sort((a, b) => a.priorityRank - b.priorityRank)[0];
};

/** 고정 골키퍼를 쿼터별 출전 quota 계산에서 제외합니다. */
export const getQuotaPlayers = <T extends QuotaCandidate>({
  gkFixed,
  players,
}: {
  gkFixed: boolean;
  players: T[];
}) => {
  const fixedGoalkeeper = gkFixed ? pickFixedGoalkeeper(players) : undefined;

  return {
    fixedGoalkeeper,
    quotaPlayers: fixedGoalkeeper
      ? players.filter((player) => player.id !== fixedGoalkeeper.id)
      : players,
  };
};

/** GK 고정 여부를 반영해 쿼터당 quota 계산 슬롯 수를 반환합니다. */
export const getQuotaSlotsPerQuarter = ({
  gkFixed,
  slotsPerQuarter,
}: {
  gkFixed: boolean;
  slotsPerQuarter: number;
}) => {
  return Math.max(slotsPerQuarter - (gkFixed ? 1 : 0), 0);
};
