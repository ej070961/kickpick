type FormationToolbarProps = {
  formationLabel: string;
  hasTemplates: boolean;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onOpenRegeneration: () => void;
};

/**
 * 현재 경기 포메이션과 저장 전 변경 상태, 포메이션 변경 진입점을 표시합니다.
 */
export function FormationToolbar({
  formationLabel,
  hasTemplates,
  hasUnsavedChanges,
  isPending,
  onOpenRegeneration,
}: FormationToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase text-muted">경기 포메이션</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-lg font-bold text-foreground">{formationLabel}</p>
          {hasUnsavedChanges ? (
            <span className="rounded-md bg-warning/20 px-2 py-1 text-xs font-bold text-foreground">
              저장 전 변경사항
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className="min-h-11 rounded-lg border border-primary px-4 text-sm font-bold text-primary hover:bg-mint-surface disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onOpenRegeneration}
        disabled={isPending || !hasTemplates}
      >
        포메이션 변경
      </button>
    </div>
  );
}
