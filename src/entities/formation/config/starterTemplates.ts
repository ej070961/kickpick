import type { FormationSlotCode } from "@/entities/position";

export type StarterFormationTemplate = {
  label: string;
  slots: FormationSlotCode[];
};

export const STARTER_FORMATION_TEMPLATES: StarterFormationTemplate[] = [
  {
    label: "4-2-3-1",
    slots: [
      "GK",
      "LB",
      "LCB",
      "RCB",
      "RB",
      "LDM",
      "RDM",
      "CAM",
      "LW",
      "RW",
      "CF",
    ],
  },
  {
    label: "4-3-3",
    slots: [
      "GK",
      "LB",
      "LCB",
      "RCB",
      "RB",
      "CDM",
      "LCM",
      "RCM",
      "LW",
      "RW",
      "CF",
    ],
  },
  {
    label: "4-4-2",
    slots: [
      "GK",
      "LB",
      "LCB",
      "RCB",
      "RB",
      "LM",
      "LCM",
      "RCM",
      "RM",
      "LF",
      "RF",
    ],
  },
];
