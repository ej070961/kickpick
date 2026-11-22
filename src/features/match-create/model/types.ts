import type { ParticipantIdentity } from "@/entities/match";
import type { Player, PlayerProfile } from "@/entities/player";

export type MatchCreateParticipant = PlayerProfile & ParticipantIdentity;

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
    id: player.id,
    type: "general",
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
    id: guest.id,
    type: "guest",
    mainPosition: guest.mainPosition,
    name: guest.name,
    playerNumber: guest.playerNumber,
    priorityRank: guest.priorityRank,
    subPositions: guest.subPositions,
  };
}
