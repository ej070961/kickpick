"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  message: string;
  onDismiss: () => void;
};

/** 짧은 작업 결과를 화면 하단에 잠시 알립니다. */
export function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDismiss, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-foreground text-background fixed bottom-4 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg"
    >
      <span>{message}</span>
      <button
        type="button"
        aria-label="알림 닫기"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 opacity-80 transition hover:opacity-100"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
