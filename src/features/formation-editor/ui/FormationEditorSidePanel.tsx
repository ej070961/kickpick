import { useMemo } from "react";
import { sortPlayersForBench } from "@/features/formation-editor/lib/formationEditorSummary";
import { useFormationEditorStore } from "@/features/formation-editor/model/formationEditorStore";
import { BenchPlayersPanel } from "./BenchPlayersPanel";
import { FormationEditorActions } from "./FormationEditorActions";
import { SelectedSlotPanel } from "./SelectedSlotPanel";

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
  const quarters = useFormationEditorStore((state) => state.quarters);
  const activeQuarterNumber = useFormationEditorStore(
    (state) => state.activeQuarterNumber,
  );
  const selection = useFormationEditorStore((state) => state.selection);
  const feedbackMessage = useFormationEditorStore(
    (state) => state.feedbackMessage,
  );
  const handleBenchPlayerClick = useFormationEditorStore(
    (state) => state.handleBenchPlayerClick,
  );

  const activeQuarter = quarters.find(
    (quarter) => quarter.quarterNumber === activeQuarterNumber,
  );
  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const selectedSlotId = selection?.type === "slot" ? selection.slotId : null;
  const selectedBenchPlayerId =
    selection?.type === "bench" ? selection.playerId : null;
  const selectedSlot = activeQuarter?.slots.find(
    (slot) => slot.id === selectedSlotId,
  );
  const selectedPlayer = selectedSlot?.playerId
    ? playerMap.get(selectedSlot.playerId)
    : undefined;
  const selectedBenchPlayer = selectedBenchPlayerId
    ? playerMap.get(selectedBenchPlayerId)
    : undefined;
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
      <SelectedSlotPanel
        selectedBenchPlayer={selectedBenchPlayer}
        selectedPlayer={selectedPlayer}
        selectedSlot={selectedSlot}
      />
      <BenchPlayersPanel
        activeAssignedPlayerCount={assignedPlayerIds.size}
        benchPlayers={benchPlayers}
        isDisabled={isBusy}
        hasSelectedSlot={Boolean(selectedSlotId)}
        quarterNumber={activeQuarterNumber}
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
