"use client";

import { Trash2 } from "lucide-react";
import type { Player } from "@/entities/player";
import { deletePlayer } from "@/features/player-manage/actions/playerActions";
import { SubmitButton } from "./SubmitButton";

type DeletePlayerButtonProps = {
  player: Player;
};

/**
 * 선수 카드에서 바로 사용할 수 있는 삭제 액션 버튼입니다.
 *
 * 카드 위에 삭제 버튼을 노출하되, 실수로 삭제하지 않도록 브라우저 확인을
 * 거친 뒤 서버 액션을 제출합니다.
 */
export function DeletePlayerButton({ player }: DeletePlayerButtonProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(`${player.name} 선수를 삭제할까요?`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={deletePlayer} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={player.id} />
      <SubmitButton
        className="border-mismatch/45 text-mismatch hover:border-mismatch inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition hover:bg-orange-50 disabled:opacity-60"
        pendingLabel="삭제 중"
      >
        <Trash2 size={14} aria-hidden="true" />
        삭제
      </SubmitButton>
    </form>
  );
}
