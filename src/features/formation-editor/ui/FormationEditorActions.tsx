import { Download, Save } from "lucide-react";

type FormationEditorActionsProps = {
  isPending: boolean;
  message: string | null;
  onExport: () => void;
  onSave: () => void;
};

/**
 * 편집 결과 저장과 현재 쿼터 PNG 내보내기 액션을 제공합니다.
 */
export function FormationEditorActions({
  isPending,
  message,
  onExport,
  onSave,
}: FormationEditorActionsProps) {
  return (
    <div className="sticky bottom-0 rounded-lg border border-border bg-card p-4 shadow-sm">
      {message ? (
        <p className="mb-3 rounded-lg bg-mint-surface px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      ) : null}
      <div className="grid gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Save size={18} aria-hidden="true" />
          {isPending ? "저장 중" : "저장"}
        </button>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground"
        >
          <Download size={18} aria-hidden="true" />
          현재 쿼터 PNG
        </button>
      </div>
    </div>
  );
}
