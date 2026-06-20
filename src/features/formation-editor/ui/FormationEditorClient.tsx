"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { exportElementAsPng } from "@/features/formation-export/lib/exportElementAsPng";
import { saveFormationSlots } from "@/features/formation-editor/actions/formationEditorActions";
import {
  replaceSlotPlayer,
  swapSlotPlayers,
} from "@/features/formation-editor/lib/formationEditorSlots";
import {
  calculateAssignmentItems,
  sortPlayersForBench,
} from "@/features/formation-editor/lib/formationEditorSummary";
import { sanitizeFileName } from "@/features/formation-editor/lib/formationEditorFormat";
import type {
  EditorPlayer,
  EditorQuarter,
  EditorSlot,
} from "@/features/formation-editor/model/types";
import { AssignmentSummary } from "./AssignmentSummary";
import { BenchPlayersPanel } from "./BenchPlayersPanel";
import { FormationEditorActions } from "./FormationEditorActions";
import { FormationField } from "./FormationField";
import { QuarterTabs } from "./QuarterTabs";
import { SelectedSlotPanel } from "./SelectedSlotPanel";

type FormationEditorClientProps = {
  fileBaseName: string;
  matchId: string;
  players: EditorPlayer[];
  quarters: EditorQuarter[];
};

type EditorSelection =
  | { slotId: string; type: "slot" }
  | { playerId: string; type: "bench" }
  | null;

/**
 * 쿼터별 포메이션을 편집하고 저장/PNG 내보내기를 연결하는 클라이언트 컨테이너입니다.
 */
export function FormationEditorClient({
  fileBaseName,
  matchId,
  players,
  quarters,
}: FormationEditorClientProps) {
  const [editedQuarters, setEditedQuarters] = useState(quarters);
  const [activeQuarterNumber, setActiveQuarterNumber] = useState(
    quarters[0]?.quarterNumber ?? 1,
  );
  const [selection, setSelection] = useState<EditorSelection>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const exportRef = useRef<HTMLDivElement>(null);
  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const activeQuarter =
    editedQuarters.find(
      (quarter) => quarter.quarterNumber === activeQuarterNumber,
    ) ?? editedQuarters[0];
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
  const activeAssignedPlayerIds = useMemo(
    () =>
      new Set(
        activeQuarter?.slots
          .map((slot) => slot.playerId)
          .filter((playerId): playerId is string => Boolean(playerId)) ?? [],
      ),
    [activeQuarter],
  );
  const benchPlayers = useMemo(
    () =>
      sortPlayersForBench(
        players.filter((player) => !activeAssignedPlayerIds.has(player.id)),
      ),
    [activeAssignedPlayerIds, players],
  );
  const assignmentItems = useMemo(
    () => calculateAssignmentItems({ players, quarters: editedQuarters }),
    [editedQuarters, players],
  );

  /**
   * 활성 쿼터의 슬롯 목록만 업데이트하고 안내 메시지를 초기화합니다.
   */
  function updateActiveQuarter(updater: (slots: EditorSlot[]) => EditorSlot[]) {
    setEditedQuarters((current) =>
      current.map((quarter) =>
        quarter.quarterNumber === activeQuarterNumber
          ? { ...quarter, slots: updater(quarter.slots) }
          : quarter,
      ),
    );
    setMessage(null);
  }

  /**
   * 선택 상태와 안내 메시지를 함께 초기화합니다.
   */
  function clearSelection() {
    setSelection(null);
    setMessage(null);
  }

  /**
   * 특정 슬롯에 후보 선수를 넣고 선택 상태를 초기화합니다.
   */
  function replaceSlotWithBenchPlayer({
    player,
    slotId,
  }: {
    player: EditorPlayer;
    slotId: string;
  }) {
    updateActiveQuarter((slots) =>
      replaceSlotPlayer({
        player,
        slots,
        slotId,
      }),
    );
    clearSelection();
  }

  /**
   * 선택된 슬롯과 대상 슬롯의 선수를 교환하고 선택 상태를 초기화합니다.
   */
  function swapWithSelectedSlot(targetSlotId: string, sourceSlotId: string) {
    updateActiveQuarter((slots) =>
      swapSlotPlayers({
        playerMap,
        slots,
        sourceSlotId,
        targetSlotId,
      }),
    );
    clearSelection();
  }

  /**
   * 슬롯 선택, 선택 해제, 두 슬롯 간 선수 교환, 후보 선수 선선택 교체를 처리합니다.
   */
  function handleSlotClick(slot: EditorSlot) {
    if (selectedBenchPlayer) {
      replaceSlotWithBenchPlayer({ player: selectedBenchPlayer, slotId: slot.id });
      return;
    }

    if (selection?.type !== "slot") {
      setSelection({ slotId: slot.id, type: "slot" });
      return;
    }

    if (selection.slotId === slot.id) {
      clearSelection();
      return;
    }

    swapWithSelectedSlot(slot.id, selection.slotId);
  }

  /**
   * 슬롯이 선택되어 있으면 후보 선수로 교체하고, 아니면 후보 선수를 먼저 선택합니다.
   */
  function handleBenchPlayerClick(player: EditorPlayer) {
    if (selection?.type === "slot") {
      replaceSlotWithBenchPlayer({ player, slotId: selection.slotId });
      return;
    }

    if (selection?.type === "bench" && selection.playerId === player.id) {
      clearSelection();
      return;
    }

    setMessage("교체할 유니폼을 선택해주세요.");
    setSelection({ playerId: player.id, type: "bench" });
  }

  /**
   * 현재 편집된 모든 슬롯 변경사항을 서버 액션으로 저장합니다.
   */
  function handleSave() {
    const slots = editedQuarters.flatMap((quarter) =>
      quarter.slots.map((slot) => ({
        fitScore: slot.fitScore,
        id: slot.id,
        isManual: slot.isManual,
        playerId: slot.playerId,
      })),
    );

    startTransition(async () => {
      const result = await saveFormationSlots(matchId, slots);
      setMessage(result.message);
    });
  }

  /**
   * 현재 활성 쿼터의 축구장 영역을 PNG 파일로 내보냅니다.
   */
  async function handleExport() {
    if (!exportRef.current || !activeQuarter) return;

    await exportElementAsPng({
      element: exportRef.current,
      fileName: `${sanitizeFileName(fileBaseName)}_${activeQuarter.quarterNumber}Q.png`,
    });
  }

  if (!activeQuarter) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted">
        생성된 포메이션이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AssignmentSummary
        assignmentItems={assignmentItems}
        playerCount={players.length}
        quarterCount={editedQuarters.length}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <div>
          <QuarterTabs
            activeQuarterNumber={activeQuarter.quarterNumber}
            quarters={editedQuarters}
            onQuarterChange={(quarterNumber) => {
              setActiveQuarterNumber(quarterNumber);
              clearSelection();
            }}
          />

          <FormationField
            exportRef={exportRef}
            playerMap={playerMap}
            quarter={activeQuarter}
            selectedSlotId={selectedSlotId}
            onSlotClick={handleSlotClick}
          />
        </div>

        <aside className="space-y-3">
          <SelectedSlotPanel
            selectedBenchPlayer={selectedBenchPlayer}
            selectedPlayer={selectedPlayer}
            selectedSlot={selectedSlot}
          />
          <BenchPlayersPanel
            activeAssignedPlayerCount={activeAssignedPlayerIds.size}
            benchPlayers={benchPlayers}
            hasSelectedSlot={selection?.type === "slot"}
            quarterNumber={activeQuarter.quarterNumber}
            selectedBenchPlayerId={selectedBenchPlayerId}
            onBenchPlayerClick={handleBenchPlayerClick}
          />
          <FormationEditorActions
            isPending={isPending}
            message={message}
            onExport={handleExport}
            onSave={handleSave}
          />
        </aside>
      </div>
    </div>
  );
}
