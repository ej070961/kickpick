"use client";

import { useRef, useTransition } from "react";
import { exportElementAsPng } from "@/features/formation-export/lib/exportElementAsPng";
import { saveFormationSlots } from "@/features/formation-editor/actions/formationEditorActions";
import { sanitizeFileName } from "@/features/formation-editor/lib/formationEditorFormat";
import type {
  EditorPlayer,
  EditorQuarter,
  FormationEditorTemplate,
} from "@/features/formation-editor/model/types";
import { useFormationEditorState } from "@/features/formation-editor/model/useFormationEditorState";
import { useFormationRegeneration } from "@/features/formation-editor/model/useFormationRegeneration";
import { AssignmentSummary } from "./AssignmentSummary";
import { BenchPlayersPanel } from "./BenchPlayersPanel";
import { FormationEditorActions } from "./FormationEditorActions";
import { FormationField } from "./FormationField";
import { FormationRegenerationDialog } from "./FormationRegenerationDialog";
import { FormationToolbar } from "./FormationToolbar";
import { QuarterTabs } from "./QuarterTabs";
import { SelectedSlotPanel } from "./SelectedSlotPanel";

type FormationEditorClientProps = {
  fileBaseName: string;
  formationLabel: string;
  formationTemplates: FormationEditorTemplate[];
  matchId: string;
  players: EditorPlayer[];
  quarters: EditorQuarter[];
};

/**
 * 쿼터별 포메이션을 편집하고 저장/PNG 내보내기를 연결하는 클라이언트 컨테이너입니다.
 */
export function FormationEditorClient({
  fileBaseName,
  formationLabel,
  formationTemplates,
  matchId,
  players,
  quarters,
}: FormationEditorClientProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isSavePending, startSaveTransition] = useTransition();
  const editor = useFormationEditorState({ players, quarters });
  const regeneration = useFormationRegeneration({
    formationLabel,
    formationTemplates,
    matchId,
    onMessage: editor.setMessage,
    onRegenerated: ({ quarters: nextQuarters }) => {
      editor.replaceEditedQuarters(nextQuarters);
    },
  });
  const isPending = isSavePending || regeneration.isRegenerationPending;

  /**
   * 현재 편집된 모든 슬롯 변경사항을 서버 액션으로 저장합니다.
   */
  function handleSave() {
    const slots = editor.editedQuarters.flatMap((quarter) =>
      quarter.slots.map((slot) => ({
        fitScore: slot.fitScore,
        id: slot.id,
        isManual: slot.isManual,
        playerId: slot.playerId,
      })),
    );

    startSaveTransition(async () => {
      const result = await saveFormationSlots(matchId, slots);
      editor.setMessage(result.message);
      if (result.success) {
        editor.markSaved();
      }
    });
  }

  /**
   * 현재 활성 쿼터의 축구장 영역을 PNG 파일로 내보냅니다.
   */
  async function handleExport() {
    if (!exportRef.current || !editor.activeQuarter) return;

    await exportElementAsPng({
      element: exportRef.current,
      fileName: `${sanitizeFileName(fileBaseName)}_${editor.activeQuarter.quarterNumber}Q.png`,
    });
  }

  if (!editor.activeQuarter) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted">
        생성된 포메이션이 없습니다.
      </div>
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
      />

      <AssignmentSummary
        assignmentItems={editor.assignmentItems}
        playerCount={players.length}
        quarterCount={editor.editedQuarters.length}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <div>
          <QuarterTabs
            activeQuarterNumber={editor.activeQuarter.quarterNumber}
            quarters={editor.editedQuarters}
            onQuarterChange={(quarterNumber) => {
              editor.setActiveQuarterNumber(quarterNumber);
              editor.clearSelection();
            }}
          />

          <FormationField
            exportRef={exportRef}
            playerMap={editor.playerMap}
            quarter={editor.activeQuarter}
            selectedSlotId={editor.selectedSlotId}
            onSlotClick={editor.handleSlotClick}
          />
        </div>

        <aside className="space-y-3">
          <SelectedSlotPanel
            selectedBenchPlayer={editor.selectedBenchPlayer}
            selectedPlayer={editor.selectedPlayer}
            selectedSlot={editor.selectedSlot}
          />
          <BenchPlayersPanel
            activeAssignedPlayerCount={editor.activeAssignedPlayerIds.size}
            benchPlayers={editor.benchPlayers}
            hasSelectedSlot={Boolean(editor.selectedSlotId)}
            quarterNumber={editor.activeQuarter.quarterNumber}
            selectedBenchPlayerId={editor.selectedBenchPlayerId}
            onBenchPlayerClick={editor.handleBenchPlayerClick}
          />
          <FormationEditorActions
            isPending={isPending}
            message={editor.message}
            onExport={handleExport}
            onSave={handleSave}
          />
        </aside>
      </div>

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
