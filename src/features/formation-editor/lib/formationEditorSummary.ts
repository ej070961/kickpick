import type {
  AssignmentSummaryItem,
  EditorPlayer,
  EditorQuarter,
} from "@/features/formation-editor/model/types";

/**
 * 선수 번호와 이름을 기준으로 후보 선수 목록을 안정적으로 정렬합니다.
 */
export function sortPlayersForBench(players: EditorPlayer[]) {
  return [...players].sort((a, b) => {
    const aNumber = a.playerNumber ?? Number.POSITIVE_INFINITY;
    const bNumber = b.playerNumber ?? Number.POSITIVE_INFINITY;

    if (aNumber !== bNumber) return aNumber - bNumber;

    return a.name.localeCompare(b.name);
  });
}

/**
 * 전체 쿼터에서 선수별 출전 쿼터 목록을 계산하고 많이 배정된 순서로 정렬합니다.
 */
export function calculateAssignmentItems({
  players,
  quarters,
}: {
  players: EditorPlayer[];
  quarters: EditorQuarter[];
}): AssignmentSummaryItem[] {
  return players
    .map((player) => ({
      player,
      quarterNumbers: quarters
        .filter((quarter) =>
          quarter.slots.some((slot) => slot.playerId === player.id),
        )
        .map((quarter) => quarter.quarterNumber),
    }))
    .sort((a, b) => {
      if (b.quarterNumbers.length !== a.quarterNumbers.length) {
        return b.quarterNumbers.length - a.quarterNumbers.length;
      }

      const aNumber = a.player.playerNumber ?? Number.POSITIVE_INFINITY;
      const bNumber = b.player.playerNumber ?? Number.POSITIVE_INFINITY;

      if (aNumber !== bNumber) return aNumber - bNumber;

      return a.player.name.localeCompare(b.player.name);
    });
}
