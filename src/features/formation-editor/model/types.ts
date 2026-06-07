import type {
  FormationSlotCode,
  PlayerPositionCode,
} from "@/entities/position";

export type EditorPlayer = {
  id: string;
  mainPosition: PlayerPositionCode;
  name: string;
  playerNumber: number | null;
  subPositions: PlayerPositionCode[];
};

export type EditorSlot = {
  fitScore: number | null;
  id: string;
  isManual: boolean;
  name: FormationSlotCode;
  playerId: string | null;
  x: number;
  y: number;
};

export type EditorQuarter = {
  quarterNumber: number;
  slots: EditorSlot[];
};

export type AssignmentSummaryItem = {
  player: EditorPlayer;
  quarterNumbers: number[];
};
