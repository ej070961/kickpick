"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Player } from "@/entities/player";
import { deletePlayer } from "@/features/player-manage/actions/playerActions";
import { Button, ConfirmDialog } from "@/shared/ui";
import { SubmitButton } from "./SubmitButton";

type DeletePlayerButtonProps = {
  player: Player;
};

/**
 * 선수 카드에서 바로 사용할 수 있는 삭제 액션 버튼입니다.
 *
 * 카드 위에 삭제 버튼을 노출하되, 앱 내부 확인 dialog를 거친 뒤
 * 서버 액션을 제출합니다.
 */
export function DeletePlayerButton({ player }: DeletePlayerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(deletePlayer, {});
  const isDialogOpen = isOpen && !state.success;

  return (
    <>
      <Button
        aria-label={`${player.name} 선수 삭제`}
        className="size-9 px-0 sm:size-auto sm:px-3"
        leftIcon={<Trash2 size={14} aria-hidden="true" />}
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="danger"
      >
        <span className="hidden sm:inline">삭제</span>
      </Button>

      <ConfirmDialog
        description="이미 만들어진 경기 기록은 그대로 유지됩니다."
        isOpen={isDialogOpen}
        onClose={() => setIsOpen(false)}
        title={`${player.name} 선수를 삭제할까요?`}
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={player.id} />
          {state.message && !state.success ? (
            <p className="text-mismatch rounded-lg bg-orange-50 px-3 py-2 text-sm">
              {state.message}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              onClick={() => setIsOpen(false)}
              variant="secondary"
            >
              취소
            </Button>
            <SubmitButton
              className="w-full sm:w-auto"
              pendingLabel="삭제 중"
              variant="dangerSolid"
            >
              삭제
            </SubmitButton>
          </div>
        </form>
      </ConfirmDialog>
    </>
  );
}
