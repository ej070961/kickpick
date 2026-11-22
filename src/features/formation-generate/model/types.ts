import type { AssignedSlot, FormationPreset } from "@/entities/formation";
import type { ParticipantIdentity } from "@/entities/match";
import type { PlayerPositionCode } from "@/entities/position";

/** 포메이션 자동 배치에 넘기는 정식 선수 또는 경기 게스트 정보입니다. */
export type FormationPlayer = ParticipantIdentity & {
  mainPosition: PlayerPositionCode;
  name: string;
  playerNumber: number | null;
  priorityRank: number;
  subPositions: PlayerPositionCode[];
};

/** 한 쿼터의 자동 배치 결과입니다. */
export type GeneratedQuarterFormation = {
  quarterNumber: number;
  slots: AssignedSlot[];
};

export type GenerateQuarterFormationsInput = {
  gkFixed: boolean;
  players: FormationPlayer[];
  preset: FormationPreset;
  quarterCount: number;
  reducedPlayerIds: string[];
};
