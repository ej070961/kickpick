"use client";

import { useMemo, useState } from "react";
import type {
  EditorPlayer,
  GuestPlayerFormInput,
  AvailablePlayer,
} from "@/features/formation-editor/model/types";
import { useEditorStore } from "@/features/formation-editor/model/store";
import { Dialog } from "@/shared/ui";
import { AvailablePlayerPicker } from "./AvailablePlayerPicker";
import { GuestPlayerForm } from "./GuestPlayerForm";
import { ParticipantsList } from "./ParticipantsList";

type Props = {
  isOpen: boolean;
  isLoadingCandidates: boolean;
  isPending: boolean;
  candidateLoadError: string | null;
  onClose: () => void;
  onRetryCandidates: () => void;
  onAddRegisteredPlayer: (playerId: string) => void;
  onRemoveParticipant: (player: EditorPlayer) => void;
  onSaveGuestPlayer: (input: GuestPlayerFormInput) => void;
  availablePlayers: AvailablePlayer[];
};

/** 경기 참가자 목록과 등록 선수·게스트 편집 영역을 조립합니다. */
export const MatchParticipantsDialog = ({
  isOpen,
  isLoadingCandidates,
  isPending,
  candidateLoadError,
  onClose,
  onRetryCandidates,
  onAddRegisteredPlayer,
  onRemoveParticipant,
  onSaveGuestPlayer,
  availablePlayers,
}: Props) => {
  const playersById = useEditorStore((state) => state.playersById);
  const players = useMemo(() => Object.values(playersById), [playersById]);
  const [editingGuest, setEditingGuest] = useState<EditorPlayer | null>(null);
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.priorityRank - b.priorityRank),
    [players],
  );
  const guestCount = sortedPlayers.filter(
    (player) => player.type === "guest",
  ).length;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="경기 명단"
      description={`참가 ${players.length}명 · ${isLoadingCandidates ? "추가 가능 선수 불러오는 중" : `추가 가능 ${availablePlayers.length}명`} · 게스트 ${guestCount}명`}
    >
      <div className="space-y-4">
        <ParticipantsList
          players={sortedPlayers}
          isPending={isPending}
          onEditGuest={setEditingGuest}
          onRemove={onRemoveParticipant}
        />
        <AvailablePlayerPicker
          availablePlayers={availablePlayers}
          isLoading={isLoadingCandidates}
          isPending={isPending}
          loadError={candidateLoadError}
          onAdd={onAddRegisteredPlayer}
          onRetry={onRetryCandidates}
        />
        <GuestPlayerForm
          key={editingGuest?.id ?? "new-guest"}
          initialPlayer={editingGuest}
          isPending={isPending}
          onCancelEdit={() => setEditingGuest(null)}
          onSave={(input) => {
            onSaveGuestPlayer(input);
            setEditingGuest(null);
          }}
        />
      </div>
    </Dialog>
  );
};
