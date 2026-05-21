import { getPositionGroup, type PositionCode } from "@/entities/position";

type FitScoreInput = {
  slotPosition: PositionCode;
  mainPosition: PositionCode;
  subPositions: PositionCode[];
};

export function calculateFitScore({
  slotPosition,
  mainPosition,
  subPositions,
}: FitScoreInput) {
  if (slotPosition === mainPosition) return 10;
  if (subPositions.includes(slotPosition)) return 5;
  if (getPositionGroup(slotPosition) === getPositionGroup(mainPosition)) {
    return 3;
  }

  return 0;
}
