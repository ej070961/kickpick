export type PlayerPositionCode =
  | "GK"
  | "LB"
  | "LWB"
  | "CB"
  | "RB"
  | "RWB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LM"
  | "RM"
  | "LW"
  | "CF"
  | "RW";

export type FormationSlotCode =
  | PlayerPositionCode
  | "LCB"
  | "RCB"
  | "RC"
  | "LDM"
  | "RDM"
  | "LCM"
  | "RCM"
  | "LF"
  | "RF";

export type PositionCode = FormationSlotCode;

export type PositionGroup =
  | "goalkeeper"
  | "sideBack"
  | "centerBack"
  | "defensiveMidfielder"
  | "centralMidfielder"
  | "attackingMidfielder"
  | "wideForward"
  | "centerForward";
