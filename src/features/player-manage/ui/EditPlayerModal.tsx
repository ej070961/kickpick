"use client";

import { useCallback, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import type { Player } from "@/entities/player";
import { updatePlayer } from "@/features/player-manage/actions/playerActions";
import { PlayerForm } from "./PlayerForm";

/**
 * 선수 편집을 처리하는 모달 트리거입니다.
 *
 * 편집 버튼의 UI는 목록 어디에서 쓰이든 동일하게 유지하고, 모달 내부에서는
 * 공통 `PlayerForm`으로 이름과 포지션만 수정합니다. 우선순위는 목록 드래그로
 * 변경하므로 편집 폼에 노출하지 않습니다.
 */
export function EditPlayerModal({ player }: { player: Player }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [formKey, setFormKey] = useState(0);

  const openModal = () => {
    setFormKey((key) => key + 1);
    dialogRef.current?.showModal();
  };

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) closeModal();
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="border-border text-muted hover:border-primary hover:text-primary inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition"
      >
        <Pencil size={14} aria-hidden="true" />
        편집
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="bg-card m-auto w-[min(calc(100vw-2rem),28rem)] rounded-2xl p-0 shadow-xl backdrop:bg-black/50"
      >
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground min-w-0 text-base font-semibold">
            선수 편집
            <span className="text-muted ml-2 font-normal">{player.name}</span>
          </h2>
          <button
            type="button"
            onClick={closeModal}
            aria-label="닫기"
            className="text-muted hover:bg-mint-surface hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg transition"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[calc(90dvh-64px)] overflow-y-auto px-6 py-5">
          <PlayerForm
            key={formKey}
            action={updatePlayer}
            mode="edit"
            player={player}
            onSuccess={closeModal}
          />
        </div>
      </dialog>
    </>
  );
}
