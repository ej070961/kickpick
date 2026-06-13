import type { Player } from "@/entities/player";
import type { PlayerPositionCode } from "@/entities/position";

export type MatchCreateParticipant = Pick<
  Player,
  "id" | "mainPosition" | "name" | "playerNumber" | "priorityRank" | "subPositions"
> & {
  isGuest?: boolean;
};

export type GuestPlayerDraft = {
  id: string;
  mainPosition: PlayerPositionCode;
  name: string;
  playerNumber: number | null;
  priorityRank: number;
  subPositions: PlayerPositionCode[];
};

export type SerializedGuestPlayer = Omit<GuestPlayerDraft, "id"> & {
  clientId: string;
};

export function getRosterPlayerKey(playerId: string) {
  return `player:${playerId}`;
}

export function getGuestPlayerKey(guestId: string) {
  return `guest:${guestId}`;
}

export function isGuestPlayerKey(playerKey: string) {
  return playerKey.startsWith("guest:");
}

export function getIdFromPlayerKey(playerKey: string) {
  return playerKey.replace(/^(player|guest):/, "");
}

export function mapRosterPlayerToParticipant(player: Player): MatchCreateParticipant {
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
