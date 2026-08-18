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
  const [orderedPlayers, setOrderedPlayers] = useState(players);
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
  const playerIds = useMemo(
    () => orderedPlayers.map((player) => player.id),
    [orderedPlayers],
  );

  function movePlayer(fromIndex: number, toIndex: number) {
    setOrderedPlayers((current) => arrayMove(current, fromIndex, toIndex));
    setIsDirty(true);
    setStatusMessage(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = orderedPlayers.findIndex(
      (player) => player.id === active.id,
    );
    const newIndex = orderedPlayers.findIndex(
      (player) => player.id === over.id,
    );

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

  if (orderedPlayers.length === 0) {
    return (
      <div className="border-border bg-card text-muted rounded-lg border border-dashed p-6 text-sm">
        아직 등록된 선수가 없습니다. 첫 선수를 추가해주세요.
      </div>
    );
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
