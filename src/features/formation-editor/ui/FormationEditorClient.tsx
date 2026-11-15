"use client";

import { useState } from "react";
import type {
  FormationEditorInitialProps,
  QuarterSwapResult,
} from "@/features/formation-editor/model/types";
import { useEditorRoster } from "@/features/formation-editor/model/useEditorRoster";
import { useEditorSave } from "@/features/formation-editor/model/useEditorSave";
import { useFormationEditorState } from "@/features/formation-editor/model/useFormationEditorState";
import { useFormationRegeneration } from "@/features/formation-editor/model/useFormationRegeneration";
import { useFormationExport } from "@/features/formation-editor/model/useFormationExport";
import { ErrorState } from "@/shared/ui";
import { AssignmentSummary } from "./AssignmentSummary";
import { FormationEditorMainArea } from "./FormationEditorMainArea";
import { FormationEditorSidePanel } from "./FormationEditorSidePanel";
import { FormationRegenerationDialog } from "./FormationRegenerationDialog";
import { FormationToolbar } from "./FormationToolbar";
import { QuarterSwapDialog } from "./QuarterSwapDialog";
import { RosterManagementDialog } from "./RosterManagementDialog";

/**
 * 쿼터별 포메이션을 편집하고 저장/PNG 내보내기를 연결하는 클라이언트 컨테이너입니다.
 */
export function FormationEditorClient({
  formationTemplates,
  match,
  players,
  quarters,
  rosterCandidates,
}: FormationEditorInitialProps) {
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false);
  const [isQuarterSwapDialogOpen, setIsQuarterSwapDialogOpen] = useState(false);
  const [quarterSwapError, setQuarterSwapError] = useState<string | null>(null);
  const roster = useEditorRoster({
    initialPlayers: players,
    initialRosterCandidates: rosterCandidates,
    matchId: match.id,
  });
  const editor = useFormationEditorState({ players: roster.players, quarters });
  const rosterCallbacks = {
    onGuestUpdated: editor.refreshGuestAssignmentScores,
    onMessage: editor.setMessage,
    onParticipantRemoved: editor.clearParticipantAssignments,
  };
  const save = useEditorSave({
    editedQuarters: editor.editedQuarters,
    matchId: match.id,
    onMessage: editor.setMessage,
    onSaved: editor.markSaved,
  });
  const exportImage = useFormationExport({
    activeQuarter: editor.activeQuarter,
    fileBaseName: match.exportFileBaseName,
  });
  const regeneration = useFormationRegeneration({
    formationLabel: match.formationLabel,
    formationTemplates,
    matchId: match.id,
    onMessage: editor.setMessage,
    onRegenerated: ({ quarters: nextQuarters }) => {
      editor.replaceEditedQuarters(nextQuarters);
    },
  });
  const isPending =
    save.isPending || roster.isPending || regeneration.isRegenerationPending;

  const closeQuarterSwap = () => {
    setQuarterSwapError(null);
    setIsQuarterSwapDialogOpen(false);
  };

  const confirmQuarterSwap = (first: number, second: number) => {
    const result = editor.swapQuarterAssignments(first, second);

    if (result.ok) {
      closeQuarterSwap();
    } else {
      setQuarterSwapError(SWAP_ERROR_MESSAGES[result.reason]);
    }
  };

  if (!editor.activeQuarter) {
    return (
      <ErrorState
        title="생성된 포메이션이 없습니다"
        description="경기 생성 과정에서 쿼터별 포메이션이 만들어지지 않았습니다. 경기 목록으로 돌아가 다시 생성해주세요."
      />
    );
  }

  return (
    <div className="space-y-4">
      <FormationToolbar
        formationLabel={regeneration.currentFormationLabel}
        hasTemplates={formationTemplates.length > 0}
        hasUnsavedChanges={editor.hasUnsavedChanges}
        isPending={isPending}
        onOpenRegeneration={() => regeneration.setIsRegenerationOpen(true)}
        onOpenRosterManagement={() => setIsRosterDialogOpen(true)}
      />

      <AssignmentSummary
        assignmentItems={editor.assignmentItems}
        playerCount={roster.players.length}
        quarterCount={editor.editedQuarters.length}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <FormationEditorMainArea
          activeQuarter={editor.activeQuarter}
          editedQuarters={editor.editedQuarters}
          exportRef={exportImage.ref}
          isPending={isPending}
          playerMap={editor.playerMap}
          selectedSlotId={editor.selectedSlotId}
          onClearSelection={editor.clearSelection}
          onOpenQuarterSwap={() => setIsQuarterSwapDialogOpen(true)}
          onQuarterChange={editor.setActiveQuarterNumber}
          onSlotClick={(slot) => {
            if (!isPending) editor.handleSlotClick(slot);
          }}
        />

        <FormationEditorSidePanel
          activeAssignedPlayerCount={editor.activeAssignedPlayerCount}
          activeQuarterNumber={editor.activeQuarter.quarterNumber}
          benchPlayers={editor.benchPlayers}
          hasSelectedSlot={Boolean(editor.selectedSlotId)}
          isPending={isPending}
          message={editor.message}
          selectedBenchPlayer={editor.selectedBenchPlayer}
          selectedBenchPlayerId={editor.selectedBenchPlayerId}
          selectedPlayer={editor.selectedPlayer}
          selectedSlot={editor.selectedSlot}
          onBenchPlayerClick={(player) => {
            if (!isPending) editor.handleBenchPlayerClick(player);
          }}
          onExport={exportImage.downloadCurrent}
          onSave={save.submit}
        />
      </div>

      <RosterManagementDialog
        isOpen={isRosterDialogOpen}
        isPending={isPending}
        players={roster.players}
        rosterCandidates={roster.candidates}
        onAddRosterPlayer={(playerId) =>
          roster.addPlayer(playerId, rosterCallbacks)
        }
        onClose={() => setIsRosterDialogOpen(false)}
        onRemoveParticipant={(player) =>
          roster.removePlayer(player, rosterCallbacks)
        }
        onSaveGuestPlayer={(input) => roster.saveGuest(input, rosterCallbacks)}
      />

      {isQuarterSwapDialogOpen && (
        <QuarterSwapDialog
          errorMessage={quarterSwapError}
          isPending={isPending}
          onClose={closeQuarterSwap}
          onConfirm={confirmQuarterSwap}
          quarterNumbers={editor.editedQuarters.map(
            ({ quarterNumber }) => quarterNumber,
          )}
        />
      )}

      <FormationRegenerationDialog
        currentFormationLabel={regeneration.currentFormationLabel}
        hasUnsavedChanges={editor.hasUnsavedChanges}
        isPending={isPending}
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

const SWAP_ERROR_MESSAGES: Record<
  Extract<QuarterSwapResult, { ok: false }>["reason"],
  string
> = {
  same_quarter: "서로 다른 두 쿼터를 선택해주세요.",
  quarter_not_found: "선택한 쿼터를 찾을 수 없습니다. 다시 선택해주세요.",
  incompatible_positions: "두 쿼터의 포지션 구성이 달라 교환할 수 없습니다.",
};
