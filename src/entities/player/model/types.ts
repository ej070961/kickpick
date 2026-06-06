import type { PlayerPositionCode } from "@/entities/position";

export type Player = {
  id: string;
  teamId: string;
  name: string;
  playerNumber: number | null;
  mainPosition: PlayerPositionCode;
  subPositions: PlayerPositionCode[];
  priorityRank: number;
  isDeleted: boolean;
  createdAt: string;
};
