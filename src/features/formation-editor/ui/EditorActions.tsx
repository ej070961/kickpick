"use client";

import { useState } from "react";
import { Copy, Download, Save } from "lucide-react";
import { useEditorStore } from "@/features/formation-editor/model/store";
import { Toast } from "@/shared/ui";

type Props = {
  isBusy: boolean;
  isSaving: boolean;
  isExportPending: boolean;
  onCopy: () => Promise<string | null>;
  onDownloadAll: () => void;
  onSave: () => Promise<string | null>;
};

/**
 * 편집 결과 저장, 현재 쿼터 복사, 전체 쿼터 다운로드 액션을 제공합니다.
 */
export const EditorActions = ({
  isBusy,
  isSaving,
  isExportPending,
  onCopy,
  onDownloadAll,
  onSave,
}: Props) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const message = useEditorStore((state) => state.feedbackMessage);

  const handleCopy = async () => {
    const message = await onCopy();
    if (message) setToastMessage(message);
  };

  const handleSave = async () => {
    const message = await onSave();
    if (message) setToastMessage(message);
  };

  return (
    <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
      {toastMessage ? (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      ) : null}
      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="bg-mint-surface text-foreground mb-3 rounded-lg px-3 py-2 text-sm"
        >
          {message}
        </p>
      ) : null}
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isBusy}
          className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
        >
          <Save size={18} aria-hidden="true" />
          {isSaving ? "저장 중" : "저장"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={isBusy}
            className="border-border text-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold disabled:opacity-60"
          >
            <Copy size={17} aria-hidden="true" />
            이미지 복사
          </button>
          <button
            type="button"
            onClick={onDownloadAll}
            disabled={isBusy}
            className="border-border text-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold disabled:opacity-60"
          >
            <Download size={17} aria-hidden="true" />
            {isExportPending ? "준비 중" : "한 번에 받기"}
          </button>
        </div>
      </div>
    </div>
  );
};
