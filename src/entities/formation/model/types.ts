import type { PositionCode } from "@/entities/position";

export type FormationSlot = {
  name: PositionCode;
  x: number;
  y: number;
};

export type FormationPreset = {
  key: string;
  label: string;
  slots: FormationSlot[];
};

export type AssignedSlot = FormationSlot & {
  playerId: string | null;
  fitScore: number | null;
  isManual: boolean;
};

export type QuarterFormation = {
  quarterNumber: number;
  slots: AssignedSlot[];
};
