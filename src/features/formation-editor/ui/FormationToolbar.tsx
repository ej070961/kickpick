import { Badge, Button, Panel } from "@/shared/ui";

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
    <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase text-muted">경기 포메이션</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-lg font-bold text-foreground">{formationLabel}</p>
          {hasUnsavedChanges ? (
            <Badge variant="warning">저장 전 변경사항</Badge>
          ) : null}
        </div>
      </div>
      <Button
        onClick={onOpenRegeneration}
        disabled={isPending || !hasTemplates}
        variant="secondary"
        className="border-primary text-primary hover:bg-mint-surface"
      >
        포메이션 변경
      </Button>
    </Panel>
  );
}
