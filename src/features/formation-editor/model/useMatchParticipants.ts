"use client";

import { useState, useTransition } from "react";
import {
  addRegisteredPlayerToMatch,
  removeMatchParticipant,
} from "@/features/formation-editor/actions/manageParticipants";
import { saveMatchGuestPlayer } from "@/features/formation-editor/actions/manageGuests";
import { loadMatchPlayerCandidates } from "@/features/formation-editor/actions/loadMatchPlayerCandidates";
import type {
  EditorPlayer,
  GuestPlayerFormInput,
  AvailablePlayer,
} from "@/features/formation-editor/model/types";
import { useEditorStore } from "@/features/formation-editor/model/store";

type UseMatchParticipantsInput = {
  matchId: string;
};

/**
 * 경기 참가 명단 추가, 제거, 게스트 저장에 따른 선수 목록과 쿼터 상태 갱신을 관리합니다.
 */
export const useMatchParticipants = ({
  matchId,
}: UseMatchParticipantsInput) => {
  const [candidates, setCandidates] = useState<AvailablePlayer[]>([]);
  const [candidateLoadError, setCandidateLoadError] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [isLoadingCandidates, startCandidateLoad] = useTransition();
  const upsertPlayer = useEditorStore((state) => state.upsertPlayer);
  const removeParticipantFromDraft = useEditorStore(
    (state) => state.removeParticipantFromDraft,
  );
  const refreshGuestAssignments = useEditorStore(
    (state) => state.refreshGuestAssignments,
  );
  const setFeedbackMessage = useEditorStore(
    (state) => state.setFeedbackMessage,
  );

  const loadCandidates = () => {
    setCandidateLoadError(null);
    setCandidates([]);
    startCandidateLoad(async () => {
      try {
        setCandidates(await loadMatchPlayerCandidates(matchId));
      } catch {
        setCandidateLoadError("추가 가능한 선수 목록을 불러오지 못했습니다.");
      }
    });
  };

  const addPlayer = (playerId: string) => {
    startTransition(async () => {
      const result = await addRegisteredPlayerToMatch(matchId, playerId);
      setFeedbackMessage(result.message);

      if (!result.success || !result.player) return;

      upsertPlayer(result.player);
      setCandidates((current) =>
        current.filter((player) => player.id !== playerId),
      );
    });
  };

  const removePlayer = (player: EditorPlayer) => {
    startTransition(async () => {
      const result = await removeMatchParticipant(matchId, {
        id: player.id,
        type: player.type,
      });
      setFeedbackMessage(result.message);

      if (!result.success) return;

      removeParticipantFromDraft(player.id);

      if (player.type === "general") {
        const candidate: AvailablePlayer = {
          id: player.id,
          type: "general",
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
  };

  const saveGuest = (input: GuestPlayerFormInput) => {
    startTransition(async () => {
      const result = await saveMatchGuestPlayer(matchId, input);
      setFeedbackMessage(result.message);

      if (!result.success || !result.player) return;

      const savedPlayer = result.player;
      if (input.id) refreshGuestAssignments(savedPlayer);
      else upsertPlayer(savedPlayer);
    });
  };

  return {
    addPlayer,
    candidateLoadError,
    candidates,
    isLoadingCandidates,
    isPending,
    loadCandidates,
    removePlayer,
    saveGuest,
  };
};
