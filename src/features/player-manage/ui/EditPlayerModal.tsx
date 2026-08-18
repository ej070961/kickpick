"use client";

import { Pencil } from "lucide-react";
import type { Player } from "@/entities/player";
import { updatePlayer } from "@/features/player-manage/actions/playerActions";
import { Button } from "@/shared/ui";
import { PlayerFormDialog } from "./PlayerFormDialog";

/**
 * 선수 편집 모달을 여는 트리거입니다.
 */
export function EditPlayerModal({ player }: { player: Player }) {
  return (
    <PlayerFormDialog
      action={updatePlayer}
      player={player}
      title="선수 편집"
      trigger={(openDialog) => (
        <Button
          aria-label={`${player.name} 선수 편집`}
          className="size-9 px-0 sm:size-auto sm:px-3"
          leftIcon={<Pencil size={14} aria-hidden="true" />}
          onClick={openDialog}
          size="sm"
          variant="secondary"
        >
          <span className="hidden sm:inline">편집</span>
        </Button>
      )}
    />
  );
}
