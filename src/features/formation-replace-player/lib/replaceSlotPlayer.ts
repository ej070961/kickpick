import type { AssignedSlot } from "@/entities/formation";

export function replaceSlotPlayer(
  slots: AssignedSlot[],
  slotName: string,
  playerId: string | null,
) {
  return slots.map((slot) =>
    slot.name === slotName
      ? {
          ...slot,
          playerId,
          fitScore: null,
          isManual: true,
        }
      : slot,
  );
}
