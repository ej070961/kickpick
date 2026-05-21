"use client";

import { useCallback, useRef, useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { createPlayer } from "@/features/player-manage/actions/playerActions";
import { PlayerForm } from "./PlayerForm";

/**
 * 선수 추가 모달을 여는 트리거와 다이얼로그를 렌더링합니다.
 *
 * 모달을 열 때마다 내부 폼 키를 갱신해 직전 입력값과 서버 액션 상태가
 * 다음 생성 작업에 남지 않도록 초기화합니다.
 */
export function CreatePlayerModal() {
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
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
      >
        <PlusCircle size={18} aria-hidden="true" />
        선수 추가
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="m-auto w-[min(calc(100vw-2rem),28rem)] rounded-2xl bg-card p-0 shadow-xl backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">선수 추가</h2>
          <button
            type="button"
            onClick={closeModal}
            aria-label="닫기"
            className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-mint-surface hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[calc(90dvh-64px)] overflow-y-auto px-6 py-5">
          <PlayerForm
            key={formKey}
            action={createPlayer}
            mode="create"
            onSuccess={closeModal}
          />
        </div>
      </dialog>
    </>
  );
}
