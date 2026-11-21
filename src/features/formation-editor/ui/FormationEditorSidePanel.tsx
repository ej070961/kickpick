import { useMemo } from "react";
import { sortPlayersForBench } from "@/features/formation-editor/lib/formationEditorSummary";
import { useFormationEditorStore } from "@/features/formation-editor/model/formationEditorStore";
import { BenchPlayersPanel } from "./BenchPlayersPanel";
import { FormationEditorActions } from "./FormationEditorActions";

type Props = {
  isBusy: boolean;
  isSaving: boolean;
  isExportPending: boolean;
  onCopy: () => Promise<string | null>;
  onDownloadAll: () => void;
  onSave: () => Promise<string | null>;
};

/**
 * 편집기 store에서 보조 패널에 필요한 상태를 선택하고 하위 영역을 조립합니다.
 */
export function FormationEditorSidePanel({
  isBusy,
  isSaving,
  isExportPending,
  onCopy,
  onDownloadAll,
  onSave,
}: Props) {
  const players = useFormationEditorStore((state) => state.players);
  const quartersByNumber = useFormationEditorStore(
    (state) => state.quartersByNumber,
  );
  const selectedQuarter = useFormationEditorStore(
    (state) => state.selectedQuarter,
  );
  const selection = useFormationEditorStore((state) => state.selection);
  const feedbackMessage = useFormationEditorStore(
    (state) => state.feedbackMessage,
  );
  const handleBenchPlayerClick = useFormationEditorStore(
    (state) => state.handleBenchPlayerClick,
  );

  const activeQuarter = quartersByNumber[selectedQuarter];
  const selectedSlotId = selection?.type === "slot" ? selection.slotId : null;
  const selectedBenchPlayerId =
    selection?.type === "bench" ? selection.playerId : null;
  const assignedPlayerIds = useMemo(
    () =>
      new Set(
        activeQuarter?.slots
          .map((slot) => slot.playerId)
          .filter((playerId): playerId is NonNullable<typeof playerId> =>
            Boolean(playerId),
          ) ?? [],
      ),
    [activeQuarter],
  );
  const benchPlayers = useMemo(
    () =>
      sortPlayersForBench(
        players.filter((player) => !assignedPlayerIds.has(player.id)),
      ),
    [assignedPlayerIds, players],
  );

  return (
    <aside className="space-y-3">
      <BenchPlayersPanel
        activeAssignedPlayerCount={assignedPlayerIds.size}
        benchPlayers={benchPlayers}
        isDisabled={isBusy}
        hasSelectedSlot={Boolean(selectedSlotId)}
        quarterNumber={selectedQuarter}
        selectedBenchPlayerId={selectedBenchPlayerId ?? null}
        onBenchPlayerClick={(player) => handleBenchPlayerClick(player.id)}
      />
      <FormationEditorActions
        isBusy={isBusy}
        isSaving={isSaving}
        isExportPending={isExportPending}
        message={feedbackMessage}
        onCopy={onCopy}
        onDownloadAll={onDownloadAll}
        onSave={onSave}
      />
    </aside>
  );
}
