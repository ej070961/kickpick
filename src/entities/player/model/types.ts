import type { PositionCode } from "@/entities/position";

export type Player = {
  id: string;
  teamId: string;
  name: string;
  mainPosition: PositionCode;
  subPositions: PositionCode[];
  priorityRank: number;
  isDeleted: boolean;
  createdAt: string;
};
