import type { FormationSlotCode } from "@/entities/position";
import { calculateFitScore } from "@/features/formation-generate/lib/calculateFitScore";
import type {
  EditorPlayer,
  EditorQuarter,
  EditorSlot,
} from "@/features/formation-editor/model/types";

/**
 * 특정 슬롯과 선수의 포지션 적합도를 계산합니다.
 */
export function scoreSlot(
  slotName: FormationSlotCode,
  player: EditorPlayer | undefined,
) {
  if (!player) return null;

  return calculateFitScore({
    mainPosition: player.mainPosition,
    slotPosition: slotName,
    subPositions: player.subPositions,
  });
}

/** 참가자의 현재 배정만 갱신하고 나머지 슬롯과 쿼터는 기존 참조를 유지합니다. */
export function updateParticipantSlots(
  quarters: EditorQuarter[],
  playerId: string,
  updateSlot: (slot: EditorSlot) => EditorSlot,
) {
  const updatedQuarters = quarters.map((quarter) => {
    const slots = quarter.slots.map((slot) =>
      slot.playerId === playerId ? updateSlot(slot) : slot,
    );

    return slots.some((slot, index) => slot !== quarter.slots[index])
      ? { ...quarter, slots }
      : quarter;
  });

  return updatedQuarters.some((quarter, index) => quarter !== quarters[index])
    ? updatedQuarters
    : quarters;
}

/**
 * 두 슬롯의 배정 선수를 서로 바꾸고 각 슬롯의 fit score를 다시 계산합니다.
 */
export function swapSlotPlayers({
  playerMap,
  slots,
  sourceSlotId,
  targetSlotId,
}: {
  playerMap: Map<string, EditorPlayer>;
  slots: EditorSlot[];
  sourceSlotId: string;
  targetSlotId: string;
}) {
  const source = slots.find((item) => item.id === sourceSlotId);
  const target = slots.find((item) => item.id === targetSlotId);

  if (!source || !target) return slots;

  return slots.map((item) => {
    if (item.id === source.id) {
      const player = target.playerId
        ? playerMap.get(target.playerId)
        : undefined;

      return {
        ...item,
        fitScore: scoreSlot(item.name, player),
        isManual: true,
        playerId: target.playerId,
      };
    }

    if (item.id === target.id) {
      const player = source.playerId
        ? playerMap.get(source.playerId)
        : undefined;

      return {
        ...item,
        fitScore: scoreSlot(item.name, player),
        isManual: true,
        playerId: source.playerId,
      };
    }

    return item;
  });
}

/**
 * 같은 포지션 슬롯을 기준으로 두 쿼터의 선수 배정을 교환합니다.
 */
export function exchangeSlotAssignments({
  firstQuarterSlots,
  playerMap,
  secondQuarterSlots,
}: {
  firstQuarterSlots: EditorSlot[];
  playerMap: Map<string, EditorPlayer>;
  secondQuarterSlots: EditorSlot[];
}): {
  firstQuarterSlots: EditorSlot[];
  secondQuarterSlots: EditorSlot[];
} | null {
  const firstSlotsByName = new Map(
    firstQuarterSlots.map((slot) => [slot.name, slot]),
  );
  const secondSlotsByName = new Map(
    secondQuarterSlots.map((slot) => [slot.name, slot]),
  );

  if (
    firstSlotsByName.size === 0 ||
    firstSlotsByName.size !== firstQuarterSlots.length ||
    secondSlotsByName.size !== secondQuarterSlots.length ||
    firstSlotsByName.size !== secondSlotsByName.size ||
    [...firstSlotsByName.keys()].some(
      (slotName) => !secondSlotsByName.has(slotName),
    )
  ) {
    return null;
  }

  const transferAssignments = (
    destinationSlots: EditorSlot[],
    sourceSlotsByName: Map<EditorSlot["name"], EditorSlot>,
  ) =>
    destinationSlots.map((destination) => {
      const source = sourceSlotsByName.get(destination.name);
      const player = source?.playerId
        ? playerMap.get(source.playerId)
        : undefined;

      return {
        ...destination,
        fitScore: scoreSlot(destination.name, player),
        isManual: true,
        playerId: source?.playerId ?? null,
      };
    });

  return {
    firstQuarterSlots: transferAssignments(
      firstQuarterSlots,
      secondSlotsByName,
    ),
    secondQuarterSlots: transferAssignments(
      secondQuarterSlots,
      firstSlotsByName,
    ),
  };
}

/**
 * 선택된 슬롯의 선수를 후보 선수로 교체하고 같은 쿼터 내 중복 배정을 제거합니다.
 */
export function replaceSlotPlayer({
  player,
  slots,
  slotId,
}: {
  player: EditorPlayer;
  slots: EditorSlot[];
  slotId: string;
}) {
  return slots.map((slot) => {
    if (slot.id !== slotId) {
      if (slot.playerId !== player.id) return slot;

      return {
        ...slot,
        fitScore: null,
        isManual: true,
        playerId: null,
      };
    }

    return {
      ...slot,
      fitScore: scoreSlot(slot.name, player),
      isManual: true,
      playerId: player.id,
    };
  });
}
