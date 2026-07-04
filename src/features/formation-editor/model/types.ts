import type {
  FormationSlotCode,
  PlayerPositionCode,
} from "@/entities/position";

export type EditorPlayer = {
  id: string;
  isGuest?: boolean;
  mainPosition: PlayerPositionCode;
  name: string;
  playerNumber: number | null;
  priorityRank: number;
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

export type FormationEditorTemplate = {
  id: string;
  label: string;
};

export type FormationRegenerationMode = "full" | "preserve_players";

export type RosterCandidate = EditorPlayer & {
  isGuest?: false;
};

export type GuestPlayerFormInput = {
  id?: string;
  mainPosition: PlayerPositionCode;
  name: string;
  playerNumber: number | null;
  subPositions: PlayerPositionCode[];
};
