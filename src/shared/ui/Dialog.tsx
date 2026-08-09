"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

type DialogProps = {
  children: ReactNode;
  description?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

/**
 * 앱 전반에서 쓰는 기본 모달 레이아웃입니다.
 */
export function Dialog({
  children,
  description,
  isOpen,
  onClose,
  title,
}: DialogProps) {
  const titleId = useId();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="border-border bg-card max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-hidden rounded-lg border shadow-xl">
        <div className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 id={titleId} className="text-foreground text-lg font-bold">
              {title}
            </h2>
            {description ? (
              <p className="text-muted mt-1 text-sm">{description}</p>
            ) : null}
          </div>
          <Button
            aria-label="닫기"
            className="size-9 shrink-0 px-0"
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>
        <div className="max-h-[calc(100dvh-8rem)] overflow-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
