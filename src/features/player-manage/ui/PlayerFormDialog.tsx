"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import type { Player } from "@/entities/player";
import { Dialog } from "@/shared/ui";
import { PlayerForm } from "./PlayerForm";

type Props = {
  action: ComponentProps<typeof PlayerForm>["action"];
  player?: Player;
  title: string;
  trigger: (openDialog: () => void) => ReactNode;
};

/**
 * 선수 생성/수정 폼을 공통 dialog 안에서 렌더링합니다.
 *
 * dialog를 닫으면 폼을 unmount해 입력값과 Server Action 상태를 자연스럽게
 * 초기화합니다.
 */
export function PlayerFormDialog({ action, player, title, trigger }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  function openDialog() {
    setIsOpen(true);
  }

  function closeDialog() {
    setIsOpen(false);
  }

  return (
    <>
      {trigger(openDialog)}
      <Dialog
        bodyClassName="max-h-[calc(90dvh-64px)] px-6 py-5"
        isOpen={isOpen}
        onClose={closeDialog}
        panelClassName="max-w-lg rounded-2xl border-0"
        title={title}
      >
        <PlayerForm action={action} player={player} onSuccess={closeDialog} />
      </Dialog>
    </>
  );
}
