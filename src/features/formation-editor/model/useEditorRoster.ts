"use client";

import { useState, useTransition } from "react";
import {
  addMatchRosterPlayer,
  removeMatchParticipant,
  saveMatchGuestPlayer,
} from "@/features/formation-editor/actions/formationEditorActions";
import type {
  EditorPlayer,
  GuestPlayerFormInput,
  RosterCandidate,
} from "@/features/formation-editor/model/types";
import { getIdFromPlayerKey, getRosterPlayerKey } from "@/entities/match";
import { useFormationEditorStore } from "@/features/formation-editor/model/formationEditorStore";

type UseEditorRosterInput = {
  initialRosterCandidates: RosterCandidate[];
  matchId: string;
};

/**
 * 경기 참가 명단 추가, 제거, 게스트 저장에 따른 선수 목록과 쿼터 상태 갱신을 관리합니다.
 */
export function useEditorRoster({
  initialRosterCandidates,
  matchId,
}: UseEditorRosterInput) {
  const [candidates, setCandidates] = useState(initialRosterCandidates);
  const [isPending, startTransition] = useTransition();
  const upsertPlayer = useFormationEditorStore((state) => state.upsertPlayer);
  const removeParticipantFromDraft = useFormationEditorStore(
    (state) => state.removeParticipantFromDraft,
  );
  const refreshGuestAssignments = useFormationEditorStore(
    (state) => state.refreshGuestAssignments,
  );
  const setFeedbackMessage = useFormationEditorStore(
    (state) => state.setFeedbackMessage,
  );

  function addPlayer(playerId: string) {
    startTransition(async () => {
      const result = await addMatchRosterPlayer(matchId, playerId);
      setFeedbackMessage(result.message);

      if (!result.success || !result.player) return;

      upsertPlayer({ ...result.player, isGuest: false });
      setCandidates((current) =>
        current.filter((player) => getIdFromPlayerKey(player.id) !== playerId),
      );
    });
  }

  function removePlayer(player: EditorPlayer) {
    startTransition(async () => {
      const result = await removeMatchParticipant(matchId, player.id);
      setFeedbackMessage(result.message);

      if (!result.success) return;

      removeParticipantFromDraft(player.id);

      if (!player.isGuest) {
        const candidate: RosterCandidate = {
          id: getRosterPlayerKey(getIdFromPlayerKey(player.id)),
          isGuest: false,
          mainPosition: player.mainPosition,
          name: player.name,
          playerNumber: player.playerNumber,
          priorityRank: player.priorityRank,
          subPositions: player.subPositions,
        };
        setCandidates((current) =>
          [...current, candidate].sort(
            (a, b) => a.priorityRank - b.priorityRank,
          ),
        );
      }
    });
  }

  function saveGuest(input: GuestPlayerFormInput) {
    startTransition(async () => {
      const result = await saveMatchGuestPlayer(matchId, input);
      setFeedbackMessage(result.message);

      if (!result.success || !result.player) return;

      const savedPlayer = result.player;
      if (input.id) refreshGuestAssignments(savedPlayer);
      else upsertPlayer(savedPlayer);
    });
  }

  return {
    addPlayer,
    candidates,
    isPending,
    removePlayer,
    saveGuest,
  };
}
