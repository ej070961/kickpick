import type { FormationSlotCode } from "@/entities/position";
import { calculateFitScore } from "@/features/formation-generate/lib/calculateFitScore";
import type {
  QuarterDraft,
  QuarterDraftMap,
  EditorPlayer,
  EditorSlot,
} from "@/features/formation-editor/model/types";

/**
 * 특정 슬롯과 선수의 포지션 적합도를 계산합니다.
 */
export const scoreSlot = (
  slotName: FormationSlotCode,
  player: EditorPlayer | undefined,
) => {
  if (!player) return null;

  return calculateFitScore({
    mainPosition: player.mainPosition,
    slotPosition: slotName,
    subPositions: player.subPositions,
  });
};

/** 참가자의 현재 배정만 갱신하고 나머지 슬롯과 쿼터는 기존 참조를 유지합니다. */
export const updateParticipantSlots = (
  quarters: QuarterDraftMap,
  playerId: string,
  updateSlot: (slot: EditorSlot) => EditorSlot,
) => {
  let didUpdate = false;
  const updatedQuarters = Object.fromEntries(
    Object.entries(quarters).map(([quarterNumber, quarter]) => {
      let didUpdateQuarter = false;
      const slots = quarter.slots.map((slot) => {
        if (slot.playerId !== playerId) return slot;
        const updatedSlot = updateSlot(slot);
        if (updatedSlot !== slot) {
          didUpdate = true;
          didUpdateQuarter = true;
        }
        return updatedSlot;
      });

      const nextQuarter: QuarterDraft = didUpdateQuarter
        ? { ...quarter, slots }
        : quarter;

      return [quarterNumber, nextQuarter];
    }),
  );

  return didUpdate ? updatedQuarters : quarters;
};

/**
 * 두 슬롯의 배정 선수를 서로 바꾸고 각 슬롯의 fit score를 다시 계산합니다.
 */
export const swapSlotPlayers = ({
  playersById,
  slots,
  sourceSlotId,
  targetSlotId,
}: {
  playersById: Record<string, EditorPlayer>;
  slots: EditorSlot[];
  sourceSlotId: string;
  targetSlotId: string;
}) => {
  const source = slots.find((item) => item.id === sourceSlotId);
  const target = slots.find((item) => item.id === targetSlotId);

  if (!source || !target) return slots;

  return slots.map((item) => {
    if (item.id === source.id) {
      const player = target.playerId ? playersById[target.playerId] : undefined;

      return {
        ...item,
        fitScore: scoreSlot(item.name, player),
        isManual: true,
        playerId: target.playerId,
      };
    }

    if (item.id === target.id) {
      const player = source.playerId ? playersById[source.playerId] : undefined;

      return {
        ...item,
        fitScore: scoreSlot(item.name, player),
        isManual: true,
        playerId: source.playerId,
      };
    }

    return item;
  });
};

/** 원본 쿼터의 선수 배정을 같은 포지션 기준으로 대상 쿼터에 복사합니다. */
export const copySlotAssignments = ({
  destinationSlots,
  playersById,
  sourceSlots,
}: {
  destinationSlots: EditorSlot[];
  playersById: Record<string, EditorPlayer>;
  sourceSlots: EditorSlot[];
}): EditorSlot[] | null => {
  const sourceSlotsByName = new Map(
    sourceSlots.map((slot) => [slot.name, slot]),
  );

  if (
    sourceSlotsByName.size === 0 ||
    sourceSlotsByName.size !== sourceSlots.length ||
    destinationSlots.length !== sourceSlotsByName.size ||
    destinationSlots.some((slot) => !sourceSlotsByName.has(slot.name))
  ) {
    return null;
  }

  return destinationSlots.map((destination) => {
    const source = sourceSlotsByName.get(destination.name);
    const player = source?.playerId ? playersById[source.playerId] : undefined;

    return {
      ...destination,
      fitScore: scoreSlot(destination.name, player),
      isManual: true,
      playerId: source?.playerId ?? null,
    };
  });
};

/**
 * 선택된 슬롯의 선수를 후보 선수로 교체하고 같은 쿼터 내 중복 배정을 제거합니다.
 */
export const replaceSlotPlayer = ({
  player,
  slots,
  slotId,
}: {
  player: EditorPlayer;
  slots: EditorSlot[];
  slotId: string;
}) => {
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
};
