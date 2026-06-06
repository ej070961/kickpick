import type {
  FormationSlotCode,
  PlayerPositionCode,
  PositionCode,
  PositionGroup,
} from "../model/types";

export const PLAYER_POSITION_CODES: PlayerPositionCode[] = [
  "GK",
  "LB",
  "LWB",
  "CB",
  "RB",
  "RWB",
  "CDM",
  "CM",
  "CAM",
  "LM",
  "RM",
  "LW",
  "CF",
  "RW",
];

export const FORMATION_SLOT_CODES: FormationSlotCode[] = [
  "GK",
  "LB",
  "LWB",
  "LCB",
  "CB",
  "RCB",
  "RB",
  "RWB",
  "RC",
  "LDM",
  "CDM",
  "RDM",
  "LCM",
  "CM",
  "RCM",
  "CAM",
  "LM",
  "RM",
  "LW",
  "LF",
  "CF",
  "RF",
  "RW",
];

export const POSITION_CODES = PLAYER_POSITION_CODES;

export const SLOT_POSITION_TO_PLAYER_POSITION: Record<
  FormationSlotCode,
  PlayerPositionCode
> = {
  GK: "GK",
  LB: "LB",
  LWB: "LWB",
  LCB: "CB",
  CB: "CB",
  RCB: "CB",
  RB: "RB",
  RWB: "RWB",
  RC: "RB",
  LDM: "CDM",
  CDM: "CDM",
  RDM: "CDM",
  LCM: "CM",
  CM: "CM",
  RCM: "CM",
  CAM: "CAM",
  LM: "LM",
  RM: "RM",
  LW: "LW",
  LF: "CF",
  CF: "CF",
  RF: "CF",
  RW: "RW",
};

export const POSITION_GROUPS: Record<PositionGroup, PlayerPositionCode[]> = {
  goalkeeper: ["GK"],
  sideBack: ["LB", "LWB", "RB", "RWB"],
  centerBack: ["CB"],
  defensiveMidfielder: ["CDM"],
  centralMidfielder: ["CM"],
  attackingMidfielder: ["LM", "CAM", "RM"],
  wideForward: ["LW", "RW"],
  centerForward: ["CF"],
};

export function getPlayerPositionForSlot(position: FormationSlotCode) {
  return SLOT_POSITION_TO_PLAYER_POSITION[position];
}

export function getPositionGroup(position: PositionCode) {
  const playerPosition = getPlayerPositionForSlot(position);

  return Object.entries(POSITION_GROUPS).find(([, positions]) =>
    positions.includes(playerPosition),
  )?.[0] as PositionGroup | undefined;
}
