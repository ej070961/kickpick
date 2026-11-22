"use client";

import type { ComponentProps } from "react";
import type { Player } from "@/entities/player";
import { Dialog } from "@/shared/ui";
import { PlayerForm } from "./PlayerForm";

type Props = {
  action: ComponentProps<typeof PlayerForm>["action"];
  isOpen: boolean;
  onClose: () => void;
  player?: Player;
  title: string;
};

/**
 * 선수 생성/수정 폼을 공통 dialog 안에서 렌더링합니다.
 *
 * dialog를 닫으면 폼을 unmount해 입력값과 Server Action 상태를 자연스럽게
 * 초기화합니다.
 */
export function PlayerFormDialog({
  action,
  isOpen,
  onClose,
  player,
  title,
}: Props) {
  if (!isOpen) return null;

  return (
    <Dialog
      bodyClassName="max-h-[calc(90dvh-64px)] px-6 py-5"
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="max-w-lg rounded-2xl border-0"
      title={title}
    >
      <PlayerForm action={action} player={player} onSuccess={onClose} />
    </Dialog>
  );
}
