import { Panel } from "@/shared/ui";
import { MatchSettingsMenu } from "./MatchSettingsMenu";

type Props = {
  formationLabel: string;
  hasTemplates: boolean;
  isPending: boolean;
  onOpenRegeneration: () => void;
  onOpenRosterManagement: () => void;
};

/**
 * 현재 경기 포메이션과 포메이션 변경 진입점을 표시합니다.
 */
export function FormationToolbar({
  formationLabel,
  hasTemplates,
  isPending,
  onOpenRegeneration,
  onOpenRosterManagement,
}: Props) {
  return (
    <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-muted text-xs font-bold uppercase">경기 포메이션</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-foreground text-lg font-bold">{formationLabel}</p>
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
