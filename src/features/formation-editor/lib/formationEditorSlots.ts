import type { FormationSlotCode } from "@/entities/position";
import { calculateFitScore } from "@/features/formation-generate/lib/calculateFitScore";
import type {
  EditorPlayer,
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
 * 선택된 슬롯의 선수를 후보 선수로 교체하고 fit score를 다시 계산합니다.
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
    if (slot.id !== slotId) return slot;

    return {
      ...slot,
      fitScore: scoreSlot(slot.name, player),
      isManual: true,
      playerId: player.id,
    };
  });
}
