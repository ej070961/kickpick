import type {
  EditorPlayer,
  EditorSlot,
} from "@/features/formation-editor/model/types";
import { BenchPlayersPanel } from "./BenchPlayersPanel";
import { FormationEditorActions } from "./FormationEditorActions";
import { SelectedSlotPanel } from "./SelectedSlotPanel";

type Props = {
  activeAssignedPlayerCount: number;
  activeQuarterNumber: number;
  benchPlayers: EditorPlayer[];
  hasSelectedSlot: boolean;
  isPending: boolean;
  message: string | null;
  onBenchPlayerClick: (player: EditorPlayer) => void;
  onExport: () => void;
  onSave: () => void;
  selectedBenchPlayer: EditorPlayer | undefined;
  selectedBenchPlayerId: string | null;
  selectedPlayer: EditorPlayer | undefined;
  selectedSlot: EditorSlot | undefined;
};

/**
 * 선택 상태, 후보 선수, 저장/내보내기 액션을 묶은 편집기 보조 패널입니다.
 */
export function FormationEditorSidePanel({
  activeAssignedPlayerCount,
  activeQuarterNumber,
  benchPlayers,
  hasSelectedSlot,
  isPending,
  message,
  onBenchPlayerClick,
  onExport,
  onSave,
  selectedBenchPlayer,
  selectedBenchPlayerId,
  selectedPlayer,
  selectedSlot,
}: Props) {
  return (
    <aside className="space-y-3">
      <SelectedSlotPanel
        selectedBenchPlayer={selectedBenchPlayer}
        selectedPlayer={selectedPlayer}
        selectedSlot={selectedSlot}
      />
      <BenchPlayersPanel
        activeAssignedPlayerCount={activeAssignedPlayerCount}
        benchPlayers={benchPlayers}
        hasSelectedSlot={hasSelectedSlot}
        quarterNumber={activeQuarterNumber}
        selectedBenchPlayerId={selectedBenchPlayerId}
        onBenchPlayerClick={onBenchPlayerClick}
      />
      <FormationEditorActions
        isPending={isPending}
        message={message}
        onExport={onExport}
        onSave={onSave}
      />
    </aside>
  );
}
