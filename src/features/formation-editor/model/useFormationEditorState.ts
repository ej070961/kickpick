"use client";

import { useMemo, useState } from "react";
import {
  exchangeSlotAssignments,
  replaceSlotPlayer,
  scoreSlot,
  swapSlotPlayers,
  updateParticipantSlots,
} from "@/features/formation-editor/lib/formationEditorSlots";
import {
  calculateAssignmentItems,
  sortPlayersForBench,
} from "@/features/formation-editor/lib/formationEditorSummary";
import type {
  EditorPlayer,
  EditorQuarter,
  EditorSlot,
  QuarterSwapResult,
} from "@/features/formation-editor/model/types";

type EditorSelection =
  { slotId: string; type: "slot" } | { playerId: string; type: "bench" } | null;

type UseFormationEditorStateInput = {
  players: EditorPlayer[];
  quarters: EditorQuarter[];
};

/**
 * 포메이션 편집기의 쿼터, 슬롯 선택, 후보 목록, 배정 요약 상태를 관리합니다.
 */
export function useFormationEditorState({
  players,
  quarters,
}: UseFormationEditorStateInput) {
  const [editedQuarters, setEditedQuarters] = useState(quarters);
  const [activeQuarterNumber, setActiveQuarterNumber] = useState(
    quarters[0]?.quarterNumber ?? 1,
  );
  const [selection, setSelection] = useState<EditorSelection>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
   * 활성 쿼터의 슬롯 목록만 업데이트하고 저장 전 변경 상태로 표시합니다.
   */
  function updateActiveQuarter(updater: (slots: EditorSlot[]) => EditorSlot[]) {
    setEditedQuarters((current) =>
      current.map((quarter) =>
        quarter.quarterNumber === activeQuarterNumber
          ? { ...quarter, slots: updater(quarter.slots) }
          : quarter,
      ),
    );
    setHasUnsavedChanges(true);
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
   * 특정 슬롯에 후보 선수를 넣고 같은 쿼터 내 중복 배정을 제거합니다.
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
   * 두 슬롯의 선수를 교환합니다.
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
   * 두 쿼터의 같은 포지션 슬롯에 배정된 선수를 바꾸고 저장 전 상태로 표시합니다.
   */
  function swapQuarterAssignments(
    firstQuarterNumber: number,
    secondQuarterNumber: number,
  ): QuarterSwapResult {
    if (firstQuarterNumber === secondQuarterNumber) {
      return { ok: false, reason: "same_quarter" };
    }

    const firstQuarter = editedQuarters.find(
      (quarter) => quarter.quarterNumber === firstQuarterNumber,
    );
    const secondQuarter = editedQuarters.find(
      (quarter) => quarter.quarterNumber === secondQuarterNumber,
    );

    if (!firstQuarter || !secondQuarter) {
      return { ok: false, reason: "quarter_not_found" };
    }

    const swapped = exchangeSlotAssignments({
      firstQuarterSlots: firstQuarter.slots,
      playerMap,
      secondQuarterSlots: secondQuarter.slots,
    });

    if (!swapped) return { ok: false, reason: "incompatible_positions" };

    setEditedQuarters((current) =>
      current.map((quarter) => {
        if (quarter.quarterNumber === firstQuarterNumber) {
          return { ...quarter, slots: swapped.firstQuarterSlots };
        }

        if (quarter.quarterNumber === secondQuarterNumber) {
          return { ...quarter, slots: swapped.secondQuarterSlots };
        }

        return quarter;
      }),
    );
    setHasUnsavedChanges(true);
    clearSelection();
    return { ok: true };
  }

  /**
   * 슬롯 선택, 선택 해제, 슬롯 간 교환, 후보 선선택 교체를 처리합니다.
   */
  function handleSlotClick(slot: EditorSlot) {
    if (selectedBenchPlayer) {
      replaceSlotWithBenchPlayer({
        player: selectedBenchPlayer,
        slotId: slot.id,
      });
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
   * 후보 카드 클릭 시 선택된 슬롯과 교체하거나 후보를 선선택합니다.
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

  /** 제거된 참가자를 저장 전 배치를 포함한 현재 초안에서 비웁니다. */
  function clearParticipantAssignments(playerId: string) {
    setEditedQuarters((current) =>
      updateParticipantSlots(current, playerId, (slot) => ({
        ...slot,
        fitScore: null,
        isManual: true,
        playerId: null,
      })),
    );
    setSelection((current) =>
      current?.type === "bench" && current.playerId === playerId
        ? null
        : current,
    );
  }

  /** 수정된 게스트가 초안에서 뛰는 포지션을 기준으로 적합도를 갱신합니다. */
  function refreshGuestAssignmentScores(player: EditorPlayer) {
    setEditedQuarters((current) =>
      updateParticipantSlots(current, player.id, (slot) => {
        const fitScore = scoreSlot(slot.name, player);
        return fitScore === slot.fitScore ? slot : { ...slot, fitScore };
      }),
    );
  }

  /**
   * 서버에서 받은 새 쿼터 목록으로 로컬 편집 상태를 교체합니다.
   */
  function replaceEditedQuarters(nextQuarters: EditorQuarter[]) {
    setEditedQuarters(nextQuarters);
    setHasUnsavedChanges(false);
    setSelection(null);
    setActiveQuarterNumber((currentQuarterNumber) =>
      nextQuarters.some(
        (quarter) => quarter.quarterNumber === currentQuarterNumber,
      )
        ? currentQuarterNumber
        : (nextQuarters[0]?.quarterNumber ?? 1),
    );
  }

  return {
    activeAssignedPlayerCount: activeAssignedPlayerIds.size,
    activeQuarter,
    assignmentItems,
    benchPlayers,
    clearParticipantAssignments,
    clearSelection,
    editedQuarters,
    handleBenchPlayerClick,
    handleSlotClick,
    hasUnsavedChanges,
    markSaved: () => setHasUnsavedChanges(false),
    message,
    playerMap,
    refreshGuestAssignmentScores,
    replaceEditedQuarters,
    selectedBenchPlayer,
    selectedBenchPlayerId,
    selectedPlayer,
    selectedSlot,
    selectedSlotId,
    setActiveQuarterNumber,
    setMessage,
    swapQuarterAssignments,
  };
}
