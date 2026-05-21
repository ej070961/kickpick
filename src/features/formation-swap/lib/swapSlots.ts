import type { AssignedSlot } from "@/entities/formation";

export function swapSlots(
  slots: AssignedSlot[],
  sourceName: string,
  targetName: string,
) {
  if (sourceName === targetName) return slots;

  const source = slots.find((slot) => slot.name === sourceName);
  const target = slots.find((slot) => slot.name === targetName);

  if (!source || !target) return slots;

  return slots.map((slot) => {
    if (slot.name === sourceName) {
      return {
        ...slot,
        playerId: target.playerId,
        fitScore: target.fitScore,
        isManual: true,
      };
    }

    if (slot.name === targetName) {
      return {
        ...slot,
        playerId: source.playerId,
        fitScore: source.fitScore,
        isManual: true,
      };
    }

    return slot;
  });
}
