"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { exportElementAsPng } from "@/features/formation-export/lib/exportElementAsPng";
import { saveFormationSlots } from "@/features/formation-editor/actions/formationEditorActions";
import {
  replaceSlotPlayer,
  swapSlotPlayers,
} from "@/features/formation-editor/lib/formationEditorSlots";
import { sanitizeFileName } from "@/features/formation-editor/lib/formationEditorFormat";
import type {
  AssignmentSummaryItem,
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

/**
 * 선수 번호와 이름을 기준으로 후보 선수 목록을 안정적으로 정렬합니다.
 */
function sortPlayersForBench(players: EditorPlayer[]) {
  return [...players].sort((a, b) => {
    const aNumber = a.playerNumber ?? Number.POSITIVE_INFINITY;
    const bNumber = b.playerNumber ?? Number.POSITIVE_INFINITY;

    if (aNumber !== bNumber) return aNumber - bNumber;

    return a.name.localeCompare(b.name);
  });
}

/**
 * 전체 쿼터에서 선수별 출전 쿼터 목록을 계산하고 많이 배정된 순서로 정렬합니다.
 */
function calculateAssignmentItems({
  players,
  quarters,
}: {
  players: EditorPlayer[];
  quarters: EditorQuarter[];
}): AssignmentSummaryItem[] {
  return players
    .map((player) => ({
      player,
      quarterNumbers: quarters
        .filter((quarter) =>
          quarter.slots.some((slot) => slot.playerId === player.id),
        )
        .map((quarter) => quarter.quarterNumber),
    }))
    .sort((a, b) => {
      if (b.quarterNumbers.length !== a.quarterNumbers.length) {
        return b.quarterNumbers.length - a.quarterNumbers.length;
      }

      const aNumber = a.player.playerNumber ?? Number.POSITIVE_INFINITY;
      const bNumber = b.player.playerNumber ?? Number.POSITIVE_INFINITY;

      if (aNumber !== bNumber) return aNumber - bNumber;

      return a.player.name.localeCompare(b.player.name);
    });
}

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
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
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
  const selectedSlot = activeQuarter?.slots.find(
    (slot) => slot.id === selectedSlotId,
  );
  const selectedPlayer = selectedSlot?.playerId
    ? playerMap.get(selectedSlot.playerId)
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
   * 슬롯 선택, 선택 해제, 두 슬롯 간 선수 교환을 처리합니다.
   */
  function handleSlotClick(slot: EditorSlot) {
    if (!selectedSlotId) {
      setSelectedSlotId(slot.id);
      return;
    }

    if (selectedSlotId === slot.id) {
      setSelectedSlotId(null);
      return;
    }

    updateActiveQuarter((slots) =>
      swapSlotPlayers({
        playerMap,
        slots,
        sourceSlotId: selectedSlotId,
        targetSlotId: slot.id,
      }),
    );
    setSelectedSlotId(null);
  }

  /**
   * 선택된 슬롯의 선수를 후보 선수로 교체합니다.
   */
  function handleBenchPlayerClick(player: EditorPlayer) {
    if (!selectedSlotId) {
      setMessage("교체할 유니폼을 먼저 선택해주세요.");
      return;
    }

    updateActiveQuarter((slots) =>
      replaceSlotPlayer({
        player,
        slots,
        slotId: selectedSlotId,
      }),
    );
    setSelectedSlotId(null);
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
              setSelectedSlotId(null);
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
            selectedPlayer={selectedPlayer}
            selectedSlot={selectedSlot}
          />
          <BenchPlayersPanel
            activeAssignedPlayerCount={activeAssignedPlayerIds.size}
            benchPlayers={benchPlayers}
            quarterNumber={activeQuarter.quarterNumber}
            selectedSlot={selectedSlot}
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
