import {
  getPlayerPositionForSlot,
  getPositionGroup,
  type FormationSlotCode,
  type PlayerPositionCode,
} from "@/entities/position";

type FitScoreInput = {
  slotPosition: FormationSlotCode;
  mainPosition: PlayerPositionCode;
  subPositions: PlayerPositionCode[];
};

export function calculateFitScore({
  slotPosition,
  mainPosition,
  subPositions,
}: FitScoreInput) {
  const slotPlayerPosition = getPlayerPositionForSlot(slotPosition);

  if (slotPlayerPosition === mainPosition) return 10;
  if (subPositions.includes(slotPlayerPosition)) return 5;
  if (getPositionGroup(slotPlayerPosition) === getPositionGroup(mainPosition)) {
    return 3;
  }

  return 0;
}
