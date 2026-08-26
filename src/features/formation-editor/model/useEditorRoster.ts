"use client";

import { useState, useTransition } from "react";
import {
  addMatchRosterPlayer,
  removeMatchParticipant,
  saveMatchGuestPlayer,
} from "@/features/formation-editor/actions/formationEditorActions";
import type {
  EditorPlayer,
  EditorQuarter,
  GuestPlayerFormInput,
  RosterCandidate,
} from "@/features/formation-editor/model/types";
import { getIdFromPlayerKey } from "@/features/match-create/model/types";

type UseEditorRosterInput = {
  initialPlayers: EditorPlayer[];
  initialRosterCandidates: RosterCandidate[];
  matchId: string;
};

type RosterActionCallbacks = {
  onMessage: (message: string) => void;
  onQuartersChanged: (quarters: EditorQuarter[]) => void;
};

/**
 * 경기 참가 명단 추가, 제거, 게스트 저장에 따른 선수 목록과 쿼터 상태 갱신을 관리합니다.
 */
export function useEditorRoster({
  initialPlayers,
  initialRosterCandidates,
  matchId,
}: UseEditorRosterInput) {
  const [players, setPlayers] = useState(initialPlayers);
  const [candidates, setCandidates] = useState(initialRosterCandidates);
  const [isPending, startTransition] = useTransition();

  function addPlayer(playerId: string, callbacks: RosterActionCallbacks) {
    startTransition(async () => {
      const result = await addMatchRosterPlayer(matchId, playerId);
      callbacks.onMessage(result.message);

      if (!result.success || !result.player) return;

      setPlayers((current) => [...current, result.player as EditorPlayer]);
      setCandidates((current) =>
        current.filter((player) => getIdFromPlayerKey(player.id) !== playerId),
      );
    });
  }

  function removePlayer(
    player: EditorPlayer,
    callbacks: RosterActionCallbacks,
  ) {
    startTransition(async () => {
      const result = await removeMatchParticipant(matchId, player.id);
      callbacks.onMessage(result.message);

      if (!result.success || !result.quarters) return;

      setPlayers((current) => current.filter((item) => item.id !== player.id));

      if (!player.isGuest) {
        setCandidates((current) =>
          [...current, { ...player, isGuest: false as const }].sort(
            (a, b) => a.priorityRank - b.priorityRank,
          ),
        );
      }

      callbacks.onQuartersChanged(result.quarters);
    });
  }

  function saveGuest(
    input: GuestPlayerFormInput,
    callbacks: RosterActionCallbacks,
  ) {
    startTransition(async () => {
      const result = await saveMatchGuestPlayer(matchId, input);
      callbacks.onMessage(result.message);

      if (!result.success || !result.player) return;

      setPlayers((current) => {
        const exists = current.some(
          (player) => player.id === result.player?.id,
        );

        return exists
          ? current.map((player) =>
              player.id === result.player?.id ? result.player : player,
            )
          : [...current, result.player as EditorPlayer];
      });

      if (result.quarters) {
        callbacks.onQuartersChanged(result.quarters);
      }
    });
  }

  return {
    addPlayer,
    candidates,
    isPending,
    players,
    removePlayer,
    saveGuest,
  };
}
