"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { deleteMatch } from "@/features/match-delete/actions/matchDeleteActions";

type DeleteMatchButtonProps = {
  matchId: string;
  matchName: string;
};

export function DeleteMatchButton({
  matchId,
  matchName,
}: DeleteMatchButtonProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(`${matchName} 경기를 삭제할까요?`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteMatch} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={matchId} />
      <DeleteSubmitButton />
    </form>
  );
}

/**
 * 서버 action 제출 중 삭제 버튼의 pending 상태를 표시합니다.
 */
function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-mismatch/45 px-3 text-sm font-semibold text-mismatch transition hover:border-mismatch hover:bg-orange-50 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? (
        "삭제 중"
      ) : (
        <>
          <Trash2 size={14} aria-hidden="true" />
          삭제
        </>
      )}
    </button>
  );
}
