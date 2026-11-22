"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Player } from "@/entities/player";
import { updatePlayer } from "@/features/player-manage/actions/playerActions";
import { Button } from "@/shared/ui";
import { PlayerFormDialog } from "./PlayerFormDialog";

/** 선수 편집 버튼과 열림 상태를 관리하고, 다이얼로그를 별도 형제로 렌더링합니다. */
export function EditPlayerModal({ player }: { player: Player }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        aria-label={`${player.name} 선수 편집`}
        className="size-9 px-0 sm:size-auto sm:px-3"
        leftIcon={<Pencil size={14} aria-hidden="true" />}
        onClick={() => setIsDialogOpen(true)}
        size="sm"
        variant="secondary"
      >
        <span className="hidden sm:inline">편집</span>
      </Button>
      <PlayerFormDialog
        action={updatePlayer}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        player={player}
        title="선수 편집"
      />
    </>
  );
}
