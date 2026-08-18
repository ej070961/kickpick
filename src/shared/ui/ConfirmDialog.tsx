"use client";

import type { ReactNode } from "react";
import { Dialog } from "./Dialog";

type Props = {
  children: ReactNode;
  description?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

/**
 * 삭제처럼 되돌리기 어려운 작업을 확인하는 좁은 dialog입니다.
 */
export function ConfirmDialog({
  children,
  description,
  isOpen,
  onClose,
  title,
}: Props) {
  return (
    <Dialog
      bodyClassName="overflow-visible px-5 py-4"
      description={description}
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="max-w-md rounded-2xl"
      title={title}
    >
      {children}
    </Dialog>
  );
}
