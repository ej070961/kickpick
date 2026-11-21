"use client";

import { useState } from "react";
import type { FormationEditorInitialProps } from "@/features/formation-editor/model/types";
import {
  FormationEditorStoreProvider,
  useFormationEditorStore,
} from "@/features/formation-editor/model/formationEditorStore";
import { useEditorRoster } from "@/features/formation-editor/model/useEditorRoster";
import { useEditorSave } from "@/features/formation-editor/model/useEditorSave";
import { useFormationExport } from "@/features/formation-editor/model/useFormationExport";
import { useFormationRegeneration } from "@/features/formation-editor/model/useFormationRegeneration";
import { ErrorState } from "@/shared/ui";
import { AssignmentSummary } from "./AssignmentSummary";
import { FormationEditorMainArea } from "./FormationEditorMainArea";
import { FormationEditorSidePanel } from "./FormationEditorSidePanel";
import { FormationExportFields } from "./FormationExportFields";
import { FormationRegenerationDialog } from "./FormationRegenerationDialog";
import { FormationToolbar } from "./FormationToolbar";
import { RosterManagementDialog } from "./RosterManagementDialog";

/** 경기 데이터마다 분리된 편집기 store와 편집 화면을 연결합니다. */
export function FormationEditorClient({
  formationTemplates,
  match,
  players,
  quarters,
  rosterCandidates,
}: FormationEditorInitialProps) {
  if (quarters.length === 0) {
    return (
      <ErrorState
        title="생성된 포메이션이 없습니다"
        description="경기 생성 과정에서 쿼터별 포메이션이 만들어지지 않았습니다. 경기 목록으로 돌아가 다시 생성해주세요."
      />
    );
  }

  return (
    <FormationEditorStoreProvider
      key={match.id}
      initialPlayers={players}
      initialQuarters={quarters}
    >
      <FormationEditorWorkspace
        formationTemplates={formationTemplates}
        match={match}
        rosterCandidates={rosterCandidates}
      />
    </FormationEditorStoreProvider>
  );
}

type WorkspaceProps = Omit<FormationEditorInitialProps, "players" | "quarters">;

/** 편집기 작업 hook과 store 구독 컴포넌트를 조립합니다. */
function FormationEditorWorkspace({
  formationTemplates,
  match,
  rosterCandidates,
}: WorkspaceProps) {
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false);
  const roster = useEditorRoster({
    initialRosterCandidates: rosterCandidates,
    matchId: match.id,
  });
  const save = useEditorSave({ matchId: match.id });
  const exportImage = useFormationExport({
    fileBaseName: match.exportFileBaseName,
  });
  const regeneration = useFormationRegeneration({
    formationLabel: match.formationLabel,
    formationTemplates,
    matchId: match.id,
  });
  const isBusy =
    save.isPending ||
    roster.isPending ||
    regeneration.isRegenerationPending ||
    exportImage.isExportPending;

  return (
    <div className="space-y-4">
      <FormationToolbar
        formationLabel={regeneration.currentFormationLabel}
        hasTemplates={formationTemplates.length > 0}
        isPending={isBusy}
        onOpenRegeneration={() => regeneration.setIsRegenerationOpen(true)}
        onOpenRosterManagement={() => setIsRosterDialogOpen(true)}
      />

      <AssignmentSummary />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <FormationEditorMainArea
          exportRef={exportImage.ref}
          isPending={isBusy}
        />

        <FormationEditorSidePanel
          isBusy={isBusy}
          isSaving={save.isPending}
          isExportPending={exportImage.isExportPending}
          onCopy={exportImage.copyCurrent}
          onDownloadAll={exportImage.downloadAll}
          onSave={save.submit}
        />
      </div>

      <FormationExportFields
        registerQuarterElement={exportImage.registerQuarterElement}
      />

      <RosterManagementDialog
        isOpen={isRosterDialogOpen}
        isPending={isBusy}
        rosterCandidates={roster.candidates}
        onAddRosterPlayer={roster.addPlayer}
        onClose={() => setIsRosterDialogOpen(false)}
        onRemoveParticipant={roster.removePlayer}
        onSaveGuestPlayer={roster.saveGuest}
      />

      <FormationRegenerationDialog
        currentFormationLabel={regeneration.currentFormationLabel}
        isPending={isBusy}
        isOpen={regeneration.isRegenerationOpen}
        mode={regeneration.regenerationMode}
        selectedTemplateId={regeneration.selectedTemplateId}
        templates={formationTemplates}
        onClose={() => regeneration.setIsRegenerationOpen(false)}
        onModeChange={regeneration.setRegenerationMode}
        onSubmit={regeneration.submitRegeneration}
        onTemplateChange={regeneration.setSelectedTemplateId}
      />
    </div>
  );
}
