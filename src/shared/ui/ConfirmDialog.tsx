"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

type Props = {
  children?: ReactNode;
  confirmLabel?: string;
  description?: ReactNode;
  isConfirmDisabled?: boolean;
  isOpen: boolean;
  isPending?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
  confirmVariant?: "primary" | "dangerSolid";
  title: string;
};

/**
 * 공통 확인 문구와 버튼을 제공하고, 필요한 경우 기능별 본문도 담는 dialog입니다.
 */
export function ConfirmDialog({
  children,
  confirmLabel = "확인",
  description,
  isConfirmDisabled = false,
  isOpen,
  isPending = false,
  onConfirm,
  onClose,
  confirmVariant = "primary",
  title,
}: Props) {
  return (
    <Dialog
      bodyClassName="overflow-visible px-5 py-4"
      description={description}
      isCloseDisabled={isPending}
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="max-w-md rounded-2xl"
      title={title}
    >
      <div className="space-y-4">
        {children}
        {onConfirm && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={onClose}
              variant="secondary"
            >
              취소
            </Button>
            <Button
              aria-busy={isPending}
              className="relative w-full sm:w-auto"
              disabled={isPending || isConfirmDisabled}
              onClick={onConfirm}
              variant={confirmVariant}
            >
              <span className={isPending ? "opacity-0" : undefined}>
                {confirmLabel}
              </span>
              {isPending && (
                <span className="absolute inset-0 grid place-items-center">
                  <LoaderCircle
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                    size={18}
                  />
                </span>
              )}
            </Button>
            <span className="sr-only" role="status">
              {isPending && "처리 중"}
            </span>
          </div>
        )}
      </div>
    </Dialog>
  );
}
