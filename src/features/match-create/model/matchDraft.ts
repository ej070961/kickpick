import type { FormationTemplate } from "@/entities/formation";
import type { Player } from "@/entities/player";
import type { GuestPlayerDraft } from "./types";

export type MatchCreateStep = "info" | "participants" | "adjustment";

export type MatchInfo = {
  formationKey: string;
  gkFixed: boolean;
  matchDate: string;
  name: string;
  quarterCount: number;
};

export type MatchInfoPatch = Partial<MatchInfo>;

export type MatchDraft = {
  guestPlayers: GuestPlayerDraft[];
  info: MatchInfo;
  playtimeAdjustmentPlayerIds: string[];
  selectedRegisteredPlayerIds: string[];
};

export type MatchDraftAction =
  | { draft: MatchDraft; type: "replaceDraft" }
  | { patch: MatchInfoPatch; type: "setInfo" }
  | { playerId: string; type: "toggleRegisteredPlayer" }
  | { playerIds: string[]; type: "setSelectedRegisteredPlayers" }
  | { guest: GuestPlayerDraft; type: "addGuestPlayer" }
  | { guest: GuestPlayerDraft; type: "editGuestPlayer" }
  | { guestId: string; type: "removeGuestPlayer" }
  | { playerIds: string[]; type: "setPlaytimeAdjustmentPlayers" }
  | { playerIds: string[]; type: "resetPlaytimeAdjustment" };

export const DEFAULT_QUARTER_COUNT = 4;
export const DEFAULT_GK_FIXED = true;

/**
 * 경기 생성 wizard에서 사용할 최초 draft를 만든다.
 *
 * 등록 선수는 기본적으로 모두 참가 상태로 시작하고, 포메이션은 첫 번째 템플릿을
 * 선택한다. 새로고침 복구가 없을 때만 이 값을 사용한다.
 */
export function createInitialMatchDraft({
  formationTemplates,
  players,
}: {
  formationTemplates: FormationTemplate[];
  players: Player[];
}): MatchDraft {
  return {
    guestPlayers: [],
    info: {
      formationKey: formationTemplates[0]?.key ?? "",
      gkFixed: DEFAULT_GK_FIXED,
      matchDate: getTodayDate(),
      name: "",
      quarterCount: DEFAULT_QUARTER_COUNT,
    },
    playtimeAdjustmentPlayerIds: [],
    selectedRegisteredPlayerIds: players.map((player) => player.id),
  };
}

/**
 * 날짜 입력 기본값으로 사용할 브라우저 기준 yyyy-mm-dd 문자열을 만든다.
 */
export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
