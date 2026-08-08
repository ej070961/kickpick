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
    <div className="border-border bg-card sticky bottom-0 rounded-lg border p-4 shadow-sm">
      {message ? (
        <p className="bg-mint-surface text-foreground mb-3 rounded-lg px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}
      <div className="grid gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
        >
          <Save size={18} aria-hidden="true" />
          {isPending ? "저장 중" : "저장"}
        </button>
        <button
          type="button"
          onClick={onExport}
          className="border-border text-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold"
        >
          <Download size={18} aria-hidden="true" />
          현재 쿼터 PNG
        </button>
      </div>
    </div>
  );
}
