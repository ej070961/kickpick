import type { PositionCode, PositionGroup } from "../model/types";

export const POSITION_CODES: PositionCode[] = [
  "GK",
  "LB",
  "LWB",
  "LCB",
  "CB",
  "RCB",
  "RWB",
  "RC",
  "LDM",
  "CDM",
  "RDM",
  "LCM",
  "CM",
  "RCM",
  "LM",
  "CAM",
  "RM",
  "LW",
  "LF",
  "CF",
  "RF",
  "RW",
];

export const POSITION_GROUPS: Record<PositionGroup, PositionCode[]> = {
  goalkeeper: ["GK"],
  sideBack: ["LB", "LWB", "RC", "RWB"],
  centerBack: ["LCB", "CB", "RCB"],
  defensiveMidfielder: ["LDM", "CDM", "RDM"],
  centralMidfielder: ["LCM", "CM", "RCM"],
  attackingMidfielder: ["LM", "CAM", "RM"],
  wideForward: ["LW", "LF", "RW", "RF"],
  centerForward: ["CF"],
};

export function getPositionGroup(position: PositionCode) {
  return Object.entries(POSITION_GROUPS).find(([, positions]) =>
    positions.includes(position),
  )?.[0] as PositionGroup | undefined;
}
