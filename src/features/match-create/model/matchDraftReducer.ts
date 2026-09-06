import type { MatchDraft, MatchDraftAction } from "./matchDraft";

/**
 * 경기 생성 draft에 사용자의 직접 입력만 반영한다.
 *
 * 출전 조정 기본값처럼 다른 데이터에서 계산되는 값은 selector와 hook에서 계산한 뒤
 * 명시적인 action payload로 넣어 reducer를 예측 가능하게 유지한다.
 */
export function matchDraftReducer(
  draft: MatchDraft,
  action: MatchDraftAction,
): MatchDraft {
  switch (action.type) {
    case "replaceDraft":
      return action.draft;

    case "setInfo":
      return {
        ...draft,
        info: { ...draft.info, ...action.patch },
      };

    case "toggleRegisteredPlayer":
      return {
        ...draft,
        selectedRegisteredPlayerIds: draft.selectedRegisteredPlayerIds.includes(
          action.playerId,
        )
          ? draft.selectedRegisteredPlayerIds.filter(
              (playerId) => playerId !== action.playerId,
            )
          : [...draft.selectedRegisteredPlayerIds, action.playerId],
      };

    case "setSelectedRegisteredPlayers":
      return {
        ...draft,
        selectedRegisteredPlayerIds: action.playerIds,
      };

    case "addGuestPlayer":
      return {
        ...draft,
        guestPlayers: [...draft.guestPlayers, action.guest],
      };

    case "editGuestPlayer":
      return {
        ...draft,
        guestPlayers: draft.guestPlayers.map((guest) =>
          guest.id === action.guest.id ? action.guest : guest,
        ),
      };

    case "removeGuestPlayer":
      return {
        ...draft,
        guestPlayers: draft.guestPlayers.filter(
          (guest) => guest.id !== action.guestId,
        ),
      };

    case "setPlaytimeAdjustmentPlayers":
    case "resetPlaytimeAdjustment":
      if (areSameIds(draft.playtimeAdjustmentPlayerIds, action.playerIds)) {
        return draft;
      }

      return {
        ...draft,
        playtimeAdjustmentPlayerIds: action.playerIds,
      };
  }
}

function areSameIds(currentIds: string[], nextIds: string[]) {
  if (currentIds.length !== nextIds.length) return false;

  return currentIds.every((currentId, index) => currentId === nextIds[index]);
}
