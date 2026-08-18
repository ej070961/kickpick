"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Player } from "@/entities/player";
import { getPositionLabel } from "@/entities/position";
import { DeletePlayerButton } from "@/features/player-manage/ui/DeletePlayerButton";
import { EditPlayerModal } from "@/features/player-manage/ui/EditPlayerModal";

type Props = {
  player: Player;
};

/**
 * 드래그 가능한 선수 관리 카드입니다.
 */
export function SortablePlayerRow({ player }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: player.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="border-border bg-card grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-lg border p-4 shadow-sm transition sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-center"
    >
      <DragHandle
        dragAttributes={attributes}
        dragListeners={listeners}
        playerName={player.name}
      />

      <div className="min-w-0 sm:contents">
        <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
          <div className="min-w-0">
            <PlayerName player={player} />
            <PlayerPositions player={player} />
          </div>
          <PlayerActions player={player} className="sm:hidden" />
        </div>
      </div>

      <PlayerActions player={player} className="hidden sm:flex" />
    </li>
  );
}

type DragHandleProps = {
  dragAttributes: ReturnType<typeof useSortable>["attributes"];
  dragListeners: ReturnType<typeof useSortable>["listeners"];
  playerName: string;
};

function DragHandle({
  dragAttributes,
  dragListeners,
  playerName,
}: DragHandleProps) {
  return (
    <button
      type="button"
      className="border-border bg-background text-muted hover:border-primary hover:text-primary flex size-11 touch-none items-center justify-center justify-self-center rounded-lg border transition"
      aria-label={`${playerName} 순위 드래그`}
      {...dragAttributes}
      {...dragListeners}
    >
      <GripVertical size={18} aria-hidden="true" />
    </button>
  );
}

function PlayerName({ player }: Props) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <p className="text-foreground min-w-0 text-lg leading-7 font-semibold break-words">
        <PlayerNumber number={player.playerNumber} />
        {player.name}
      </p>
    </div>
  );
}

function PlayerNumber({ number }: { number: Player["playerNumber"] }) {
  if (number === null) return null;

  return <span className="text-primary mr-2">No.{number}</span>;
}

function PlayerActions({
  className = "",
  player,
}: {
  className?: string;
  player: Player;
}) {
  return (
    <div className={`flex shrink-0 items-center gap-2 ${className}`}>
      <EditPlayerModal player={player} />
      <DeletePlayerButton player={player} />
    </div>
  );
}

function PlayerPositions({ player }: { player: Player }) {
  const secondaryPositions = player.subPositions.filter(
    (position) => position !== player.mainPosition,
  );
  const mainPositionLabel = getPositionLabel(player.mainPosition);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span
        aria-label={`주 포지션 ${player.mainPosition} ${mainPositionLabel.description}`}
        className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold"
      >
        {player.mainPosition}
      </span>
      <SecondaryPositionBadges positions={secondaryPositions} />
    </div>
  );
}

function SecondaryPositionBadges({
  positions,
}: {
  positions: Player["subPositions"];
}) {
  if (positions.length === 0) {
    return null;
  }

  return positions.map((position) => (
    <span
      key={position}
      aria-label={`부 포지션 ${position} ${getPositionLabel(position).description}`}
      className="border-border bg-background text-muted rounded-md border px-2.5 py-1 text-sm font-medium"
    >
      {position}
    </span>
  ));
}
