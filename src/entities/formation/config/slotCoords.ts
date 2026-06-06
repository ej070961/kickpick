import type { FormationSlotCode } from "@/entities/position";

export const DEFAULT_SLOT_COORDS: Record<
  FormationSlotCode,
  { x: number; y: number }
> = {
  GK: { x: 50, y: 90 },
  LB: { x: 18, y: 72 },
  LWB: { x: 14, y: 64 },
  LCB: { x: 34, y: 76 },
  CB: { x: 50, y: 78 },
  RCB: { x: 66, y: 76 },
  RB: { x: 82, y: 72 },
  RWB: { x: 86, y: 64 },
  RC: { x: 82, y: 72 },
  LDM: { x: 38, y: 58 },
  CDM: { x: 50, y: 58 },
  RDM: { x: 62, y: 58 },
  LCM: { x: 35, y: 52 },
  CM: { x: 50, y: 52 },
  RCM: { x: 65, y: 52 },
  CAM: { x: 50, y: 40 },
  LM: { x: 20, y: 48 },
  RM: { x: 80, y: 48 },
  LW: { x: 22, y: 30 },
  LF: { x: 40, y: 26 },
  CF: { x: 50, y: 24 },
  RF: { x: 60, y: 26 },
  RW: { x: 78, y: 30 },
};
