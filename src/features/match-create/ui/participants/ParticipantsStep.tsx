"use client";

import type { Player } from "@/entities/player";
import type { MatchDraftSummary } from "@/features/match-create/model/matchDraftSelectors";
import type { GuestPlayerDraft } from "@/features/match-create/model/types";
import { MatchCreateStepPanel } from "../MatchCreateStepPanel";
import { GuestPanel } from "./GuestPanel";
import { RosterPlayerPicker } from "./RosterPlayerPicker";

type Props = {
  actions: ParticipantActions;
  errors: string[];
  guestPlayers: GuestPlayerDraft[];
  nextPriorityRank: number;
  players: Player[];
  selectedRegisteredPlayerIds: string[];
  setupMessage?: string;
  summary: MatchDraftSummary;
};

type ParticipantActions = {
  addGuestPlayer: (guest: GuestPlayerDraft) => void;
  editGuestPlayer: (guest: GuestPlayerDraft) => void;
  removeGuestPlayer: (guestId: string) => void;
  setSelectedRegisteredPlayers: (playerIds: string[]) => void;
  toggleRegisteredPlayer: (playerId: string) => void;
};

/**
 * 등록 선수와 게스트를 합쳐 이번 경기 참가 명단을 완성하는 두 번째 단계다.
 *
 * 서버 액션 상태 shape을 직접 알지 않고, 참가 명단에 필요한 값과 액션만 받아
 * 화면 구조를 단순하게 유지한다.
 */
export function ParticipantsStep({
  actions,
  errors,
  guestPlayers,
  nextPriorityRank,
  players,
  selectedRegisteredPlayerIds,
  setupMessage,
  summary,
}: Props) {
  return (
    <MatchCreateStepPanel
      title="참가 명단"
      description="등록 선수와 게스트를 함께 골라 이번 경기 명단을 완성해요."
      contentClassName="mt-4"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-foreground text-sm font-semibold">
          총 {summary.totalParticipantCount}명 참가 예정 · 등록 선수{" "}
          {summary.selectedRegisteredPlayerCount}명 · 게스트 {summary.guestCount}명
        </p>
        <ParticipantStatus
          hasGoalkeeper={summary.hasGoalkeeper}
          setupMessage={setupMessage}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <RosterPlayerPicker
          players={players}
          selectedRegisteredPlayerIds={selectedRegisteredPlayerIds}
          onSelectedRegisteredPlayersChange={
            actions.setSelectedRegisteredPlayers
          }
          onToggleRegisteredPlayer={actions.toggleRegisteredPlayer}
        />
        <GuestPanel
          guestPlayers={guestPlayers}
          nextPriorityRank={nextPriorityRank}
          onAddGuestPlayer={actions.addGuestPlayer}
          onEditGuestPlayer={actions.editGuestPlayer}
          onRemoveGuestPlayer={actions.removeGuestPlayer}
        />
      </div>

      <ParticipantErrors errors={errors} />
    </MatchCreateStepPanel>
  );
}

function ParticipantStatus({
  hasGoalkeeper,
  setupMessage,
}: {
  hasGoalkeeper: boolean;
  setupMessage?: string;
}) {
  if (setupMessage) {
    return <p className="text-mismatch text-sm font-semibold">{setupMessage}</p>;
  }

  if (hasGoalkeeper) {
    return <p className="text-primary text-sm font-semibold">GK 포함</p>;
  }

  return null;
}

function ParticipantErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="mt-3 space-y-1">
      {errors.map((error) => (
        <p key={error} className="text-mismatch text-xs">
          {error}
        </p>
      ))}
    </div>
  );
}
