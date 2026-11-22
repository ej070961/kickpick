"use client";

import { useState } from "react";
import type { FormationEditorProps } from "@/features/formation-editor/model/types";
import { useMatchParticipants } from "@/features/formation-editor/model/useMatchParticipants";
import { useSaveFormation } from "@/features/formation-editor/model/useSaveFormation";
import { useFormationImages } from "@/features/formation-editor/model/useFormationImages";
import { useFormationChange } from "@/features/formation-editor/model/useFormationChange";
import { AssignmentSummary } from "./AssignmentSummary";

import { ExportFields } from "./ExportFields";
import { FormationChangeDialog } from "./FormationChangeDialog";
import { FormationToolbar } from "./FormationToolbar";
import { MatchParticipantsDialog } from "./match-participants/MatchParticipantsDialog";
import { QuarterFormationsSection } from "./quarter-formations/QuarterFormationsSection";
import { QuarterLineupSection } from "./QuarterLineupSection";
import { BenchPlayersPanel } from "./BenchPlayersPanel";
import { EditorActions } from "./EditorActions";

type Props = Pick<FormationEditorProps, "match">;

/** 편집 작업 hook의 결과를 필요한 화면 영역과 다이얼로그에 연결합니다. */
export const FormationEditorContent = ({ match }: Props) => {
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] =
    useState(false);
  const participants = useMatchParticipants({
    matchId: match.id,
  });
  const save = useSaveFormation({ matchId: match.id });
  const exportImage = useFormationImages({
    fileBaseName: match.exportFileBaseName,
  });
  const regeneration = useFormationChange({
    formationLabel: match.formationLabel,
    matchId: match.id,
  });
  const isBusy =
    save.isPending ||
    participants.isPending ||
    regeneration.isRegenerationPending ||
    exportImage.isExportPending;

  return (
    <div className="space-y-4">
      <FormationToolbar
        formationLabel={regeneration.currentFormationLabel}
        isPending={
          isBusy ||
          participants.isLoadingCandidates ||
          regeneration.isLoadingTemplates
        }
        onOpenRegeneration={regeneration.openRegeneration}
        onOpenParticipants={() => {
          setIsParticipantsDialogOpen(true);
          participants.loadCandidates();
        }}
      />
      <AssignmentSummary />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
          <QuarterFormationsSection isDisabled={isBusy} />
          <QuarterLineupSection
            exportRef={exportImage.ref}
            isDisabled={isBusy}
          />
        </div>

        <aside className="space-y-3">
          <BenchPlayersPanel isDisabled={isBusy} />
          <EditorActions
            isBusy={isBusy}
            isSaving={save.isPending}
            isExportPending={exportImage.isExportPending}
            onCopy={exportImage.copyCurrent}
            onDownloadAll={exportImage.downloadAll}
            onSave={save.submit}
          />
        </aside>
      </div>

      <ExportFields
        registerQuarterElement={exportImage.registerQuarterElement}
      />
      <MatchParticipantsDialog
        isOpen={isParticipantsDialogOpen}
        isPending={isBusy}
        isLoadingCandidates={participants.isLoadingCandidates}
        candidateLoadError={participants.candidateLoadError}
        availablePlayers={participants.candidates}
        onAddRegisteredPlayer={participants.addPlayer}
        onClose={() => setIsParticipantsDialogOpen(false)}
        onRetryCandidates={participants.loadCandidates}
        onRemoveParticipant={participants.removePlayer}
        onSaveGuestPlayer={participants.saveGuest}
      />
      <FormationChangeDialog
        currentFormationLabel={regeneration.currentFormationLabel}
        isLoadingTemplates={regeneration.isLoadingTemplates}
        isPending={isBusy}
        isOpen={regeneration.isRegenerationOpen}
        loadError={regeneration.loadTemplateError}
        mode={regeneration.regenerationMode}
        selectedTemplateId={regeneration.selectedTemplateId}
        templates={regeneration.templates}
        onClose={() => regeneration.setIsRegenerationOpen(false)}
        onModeChange={regeneration.setRegenerationMode}
        onRetry={regeneration.loadTemplates}
        onSubmit={regeneration.submitRegeneration}
        onTemplateChange={regeneration.setSelectedTemplateId}
      />
    </div>
  );
};
