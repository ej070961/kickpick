"use client";

import { PlusCircle } from "lucide-react";
import { createPlayer } from "@/features/player-manage/actions/playerActions";
import { Button } from "@/shared/ui";
import { PlayerFormDialog } from "./PlayerFormDialog";

/**
 * 선수 추가 모달을 여는 트리거입니다.
 */
export function CreatePlayerModal() {
  return (
    <PlayerFormDialog
      action={createPlayer}
      title="선수 추가"
      trigger={(openDialog) => (
        <Button
          className="shadow-sm"
          leftIcon={<PlusCircle size={18} aria-hidden="true" />}
          onClick={openDialog}
        >
          선수 추가
        </Button>
      )}
    />
  );
}
