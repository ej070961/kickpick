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

/** 등록 선수와 경기 게스트가 화면에 공유하는 기본 프로필 정보입니다. */
export type PlayerProfile = Pick<
  Player,
  "mainPosition" | "name" | "playerNumber" | "priorityRank" | "subPositions"
>;
