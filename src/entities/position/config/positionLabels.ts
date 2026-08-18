import type { PlayerPositionCode } from "../model/types";

type PositionLabel = {
  description: string;
  selectLabel: string;
};

const POSITION_DESCRIPTIONS: Record<PlayerPositionCode, string> = {
  CAM: "공격형 미드필더",
  CB: "센터백",
  CDM: "수비형 미드필더",
  CF: "스트라이커",
  CM: "중앙 미드필더",
  GK: "골키퍼",
  LB: "왼쪽 사이드백",
  LM: "왼쪽 미드필더",
  LW: "왼쪽 윙어",
  LWB: "왼쪽 윙백",
  RB: "오른쪽 사이드백",
  RM: "오른쪽 미드필더",
  RW: "오른쪽 윙어",
  RWB: "오른쪽 윙백",
};

export function getPositionLabel(position: PlayerPositionCode): PositionLabel {
  const description = POSITION_DESCRIPTIONS[position];

  return {
    description,
    selectLabel: `${position}:${description}`,
  };
}
