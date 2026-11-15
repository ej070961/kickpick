import { Badge, Panel } from "@/shared/ui";
import { MatchSettingsMenu } from "./MatchSettingsMenu";

type FormationToolbarProps = {
  formationLabel: string;
  hasTemplates: boolean;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onOpenRegeneration: () => void;
  onOpenRosterManagement: () => void;
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
  onOpenRosterManagement,
}: FormationToolbarProps) {
  return (
    <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-muted text-xs font-bold uppercase">경기 포메이션</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-foreground text-lg font-bold">{formationLabel}</p>
          {hasUnsavedChanges && (
            <Badge variant="warning">변경사항을 저장해 주세요</Badge>
          )}
        </div>
      </div>
      <MatchSettingsMenu
        hasTemplates={hasTemplates}
        isDisabled={isPending}
        onOpenRegeneration={onOpenRegeneration}
        onOpenRosterManagement={onOpenRosterManagement}
      />
    </Panel>
  );
}
