"use client";

import { useMemo, useState, useTransition } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Player } from "@/entities/player";
import { updatePlayerPriorities } from "@/features/priority-reorder/actions/priorityActions";
import { PriorityBoardSummary } from "./PriorityBoardSummary";
import { SortablePlayerRow } from "./SortablePlayerRow";

type PriorityBoardProps = {
  players: Player[];
};

/**
 * 선수 목록과 우선순위 정렬을 함께 제공하는 관리 보드입니다.
 *
 * `@dnd-kit`의 포인터, 터치, 키보드 센서를 함께 사용해 데스크탑과 모바일에서
 * 동일한 카드 순서 변경 경험을 제공합니다. 변경한 순서는 저장 버튼으로 서버에
 * 반영합니다.
 */
export function PriorityBoard({ players }: PriorityBoardProps) {
  const [orderedPlayerIds, setOrderedPlayerIds] = useState(() =>
    players.map((player) => player.id),
  );
  const [isPending, startTransition] = useTransition();
  const [isDirty, setIsDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const playerIds = useMemo(() => {
    const latestPlayerIds = players.map((player) => player.id);

    return isDirty
      ? mergeLatestPlayerIdsPreservingOrder(orderedPlayerIds, latestPlayerIds)
      : latestPlayerIds;
  }, [isDirty, orderedPlayerIds, players]);
  const orderedPlayers = useMemo(() => {
    const playersById = new Map(players.map((player) => [player.id, player]));

    return playerIds.flatMap((playerId) => {
      const player = playersById.get(playerId);

      return player ? [player] : [];
    });
  }, [playerIds, players]);

  function movePlayer(fromIndex: number, toIndex: number) {
    setOrderedPlayerIds(arrayMove(playerIds, fromIndex, toIndex));
    setIsDirty(true);
    setStatusMessage(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = playerIds.indexOf(String(active.id));
    const newIndex = playerIds.indexOf(String(over.id));

    if (oldIndex >= 0 && newIndex >= 0) {
      movePlayer(oldIndex, newIndex);
    }
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updatePlayerPriorities(playerIds);
      setStatusMessage(result.message ?? null);
      if (result.success) setIsDirty(false);
    });
  }

  return (
    <div className="space-y-4">
      <PriorityBoardSummary
        isDirty={isDirty}
        isPending={isPending}
        onSave={handleSave}
        playerCount={orderedPlayers.length}
        statusMessage={statusMessage}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={playerIds}
          strategy={verticalListSortingStrategy}
        >
          <ol className="space-y-2">
            {orderedPlayers.map((player) => (
              <SortablePlayerRow key={player.id} player={player} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/**
 * 저장 전 드래그 순서를 유지하면서 최신 목록의 ID와 대조합니다.
 * 삭제된 선수 ID는 제외하고 새 선수 ID는 서버 목록 순서대로 마지막에 추가합니다.
 */
function mergeLatestPlayerIdsPreservingOrder(
  currentPlayerIds: string[],
  latestPlayerIds: string[],
) {
  const latestPlayerIdSet = new Set(latestPlayerIds);
  const existingPlayerIds = currentPlayerIds.filter((playerId) =>
    latestPlayerIdSet.has(playerId),
  );
  const existingPlayerIdSet = new Set(existingPlayerIds);
  const addedPlayerIds = latestPlayerIds.filter(
    (playerId) => !existingPlayerIdSet.has(playerId),
  );

  return [...existingPlayerIds, ...addedPlayerIds];
}
