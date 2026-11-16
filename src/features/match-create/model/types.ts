import type { MatchParticipantKey } from "@/entities/match";
import { getGuestPlayerKey, getRosterPlayerKey } from "@/entities/match";
import type { Player, PlayerProfile } from "@/entities/player";

export type MatchCreateParticipant = PlayerProfile & {
  id: MatchParticipantKey;
  isGuest?: boolean;
};

export type GuestPlayerDraft = PlayerProfile & {
  id: string;
};

export type SerializedGuestPlayer = Omit<
  GuestPlayerDraft,
  "id" | "priorityRank"
> & {
  clientId: string;
};

export function mapRosterPlayerToParticipant(
  player: Player,
): MatchCreateParticipant {
  return {
    id: getRosterPlayerKey(player.id),
    mainPosition: player.mainPosition,
    name: player.name,
    playerNumber: player.playerNumber,
    priorityRank: player.priorityRank,
    subPositions: player.subPositions,
  };
}

export function mapGuestDraftToParticipant(
  guest: GuestPlayerDraft,
): MatchCreateParticipant {
  return {
    id: getGuestPlayerKey(guest.id),
    isGuest: true,
    mainPosition: guest.mainPosition,
    name: guest.name,
    playerNumber: guest.playerNumber,
    priorityRank: guest.priorityRank,
    subPositions: guest.subPositions,
  };
}
