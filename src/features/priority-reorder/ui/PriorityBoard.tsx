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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Save } from "lucide-react";
import type { Player } from "@/entities/player";
import { DeletePlayerButton } from "@/features/player-manage/ui/DeletePlayerButton";
import { EditPlayerModal } from "@/features/player-manage/ui/EditPlayerModal";
import { updatePlayerPriorities } from "@/features/priority-reorder/actions/priorityActions";

type PriorityBoardProps = {
  players: Player[];
};

type SortablePlayerRowProps = {
  index: number;
  player: Player;
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
      await updatePlayerPriorities(playerIds);
      setIsDirty(false);
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
      <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-foreground text-base font-semibold">
            선수 {orderedPlayers.length}명
          </p>
          <p className="text-muted mt-1 text-sm">
            드래그로 자동 배치 우선순위를 조정합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isPending}
          className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-45"
        >
          <Save size={18} aria-hidden="true" />
          {isPending ? "저장 중" : isDirty ? "순위 저장" : "저장 완료"}
        </button>
      </div>
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
            {orderedPlayers.map((player, index) => (
              <SortablePlayerRow
                key={player.id}
                player={player}
                index={index}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/**
 * 드래그 가능한 선수 관리 카드입니다.
 *
 * 순위, 이름, 포지션의 시각 위계를 키우고 카드 우측 액션 영역에서 편집과
 * 삭제를 바로 실행할 수 있게 구성합니다.
 */
function SortablePlayerRow({ index, player }: SortablePlayerRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: player.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const secondaryPositions = player.subPositions.filter(
    (position) => position !== player.mainPosition,
  );

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="border-border bg-card grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-lg border p-4 shadow-sm transition sm:grid-cols-[44px_64px_minmax(0,1fr)_auto] sm:items-center"
    >
      <button
        type="button"
        className="border-border bg-background text-muted hover:border-primary hover:text-primary flex size-11 touch-none items-center justify-center rounded-lg border transition"
        aria-label={`${player.name} 순위 드래그`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} aria-hidden="true" />
      </button>

      <span className="text-primary hidden text-lg font-bold sm:block">
        #{index + 1}
      </span>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-primary shrink-0 text-base font-bold sm:hidden">
            #{index + 1}
          </span>
          <p className="text-foreground min-w-0 text-lg leading-7 font-semibold">
            {player.playerNumber !== null ? (
              <span className="text-primary mr-2">#{player.playerNumber}</span>
            ) : null}
            {player.name}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-sm font-semibold">
            {player.mainPosition}
          </span>
          {secondaryPositions.length > 0 ? (
            secondaryPositions.map((position) => (
              <span
                key={position}
                className="border-border bg-background text-muted rounded-md border px-2.5 py-1 text-sm font-medium"
              >
                {position}
              </span>
            ))
          ) : (
            <span className="border-border text-muted rounded-md border border-dashed px-2.5 py-1 text-sm font-medium">
              부 포지션 없음
            </span>
          )}
        </div>
      </div>

      <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:justify-end">
        <EditPlayerModal player={player} />
        <DeletePlayerButton player={player} />
      </div>
    </li>
  );
}
