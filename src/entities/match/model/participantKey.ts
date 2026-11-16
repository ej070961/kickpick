export type RosterPlayerKey = `player:${string}`;
export type GuestPlayerKey = `guest:${string}`;
export type MatchParticipantKey = RosterPlayerKey | GuestPlayerKey;

/** 등록 선수 id를 경기 참가자 key로 변환합니다. */
export function getRosterPlayerKey(playerId: string): RosterPlayerKey {
  return `player:${playerId}`;
}

/** 경기 게스트 id를 참가자 key로 변환합니다. */
export function getGuestPlayerKey(guestId: string): GuestPlayerKey {
  return `guest:${guestId}`;
}

/** 참가자 key가 게스트를 가리키는지 판별합니다. */
export function isGuestPlayerKey(
  playerKey: string,
): playerKey is GuestPlayerKey {
  return playerKey.startsWith("guest:");
}

/** 참가자 key에서 등록 선수 또는 게스트의 원본 id를 꺼냅니다. */
export function getIdFromPlayerKey(playerKey: string) {
  return playerKey.replace(/^(player|guest):/, "");
}
