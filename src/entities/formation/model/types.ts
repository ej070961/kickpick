import type { FormationSlotCode } from "@/entities/position";

export type FormationSlot = {
  name: FormationSlotCode;
  x: number;
  y: number;
};

export type FormationPreset = {
  key: string;
  label: string;
  slots: FormationSlot[];
};

export type FormationTemplate = FormationPreset & {
  id: string;
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
