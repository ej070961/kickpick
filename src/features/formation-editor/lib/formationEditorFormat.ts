import type { EditorPlayer } from "@/features/formation-editor/model/types";

/**
 * PNG 파일명에 사용할 수 있도록 경기명을 안전한 문자열로 변환합니다.
 */
export function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9가-힣_-]+/g, "_")
    .replace(/_+/g, "_");
}

/**
 * 등번호가 있으면 등번호와 이름을 함께 보여주는 선수 표시명을 만듭니다.
 */
export function formatPlayerName(player: EditorPlayer) {
  return player.playerNumber !== null
    ? `#${player.playerNumber} ${player.name}`
    : player.name;
}
