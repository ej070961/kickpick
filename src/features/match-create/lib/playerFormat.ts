import type { PlayerPositionCode } from "@/entities/position";

type DisplayPlayer = {
  isGuest?: boolean;
  mainPosition: PlayerPositionCode;
  name: string;
  playerNumber: number | null;
  subPositions: PlayerPositionCode[];
};

/**
 * 선수의 주/부 포지션을 검색과 요약 표시에 사용할 문자열로 변환합니다.
 */
export function formatPositions(player: DisplayPlayer) {
  return [
    player.mainPosition,
    ...player.subPositions.filter(
      (position) => position !== player.mainPosition,
    ),
  ].join(", ");
}

/**
 * 등번호가 있으면 등번호와 이름을 함께 보여주는 선수 표시명을 만듭니다.
 */
export function formatPlayerName(player: DisplayPlayer) {
  return player.playerNumber !== null
    ? `#${player.playerNumber} ${player.name}`
    : player.name;
}
