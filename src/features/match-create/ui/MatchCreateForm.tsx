"use client";

import { useActionState, useState } from "react";
import type { Dispatch } from "react";
import type { FormationTemplate } from "@/entities/formation";
import type { Player } from "@/entities/player";
import {
  createMatch,
  type MatchCreateState,
} from "@/features/match-create/actions/matchCreateActions";
import type {
  MatchCreateStep,
  MatchDraft,
  MatchDraftAction,
} from "@/features/match-create/model/matchDraft";
import type {
  MatchDraftSummary,
  StepAccess,
} from "@/features/match-create/model/matchDraftSelectors";
import { useMatchDraft } from "@/features/match-create/model/useMatchDraft";
import { AdjustmentStep } from "./adjustment/AdjustmentStep";
import { MatchCreateFooter } from "./MatchCreateFooter";
import { MatchCreateHiddenFields } from "./MatchCreateHiddenFields";
import { MatchCreateStepGuard } from "./MatchCreateStepGuard";
import { MatchCreateStepNav } from "./MatchCreateStepNav";
import { MatchInfoStep } from "./match-info/MatchInfoStep";
import { ParticipantsStep } from "./participants/ParticipantsStep";

type Props = {
  formationTemplates: FormationTemplate[];
  players: Player[];
};

/**
 * 새 경기 생성 form의 서버 액션 연결과 단계 조립을 담당한다.
 *
 * 경기 초안 상태, 파생 계산, 새로고침 복구는 `useMatchDraft`에 위임해 이 컴포넌트가
 * 화면 흐름을 위에서 아래로 읽을 수 있게 유지한다.
 */
export function MatchCreateForm({ formationTemplates, players }: Props) {
  const [state, action] = useActionState(createMatch, {});
  const [step, setStep] = useState<MatchCreateStep>("info");
  const { dispatch, draft, stepAccess, summary } = useMatchDraft({
    formationTemplates,
    players,
  });

  const currentStepAccess = stepAccess[step];
  const participantSetupMessage =
    stepAccess.adjustment.requiredStep === "participants"
      ? stepAccess.adjustment.message
      : undefined;
  const participantErrors = [
    state.errors?.playerIds?.[0],
    state.errors?.playerKeys?.[0],
    state.errors?.guestPlayers?.[0],
  ].filter((error): error is string => Boolean(error));
  const nextGuestPriorityRank =
    Math.max(
      0,
      ...summary.selectedRegisteredPlayers.map((player) => player.priorityRank),
      ...draft.guestPlayers.map((guest) => guest.priorityRank),
    ) + 1;

  return (
    <form action={action} className="space-y-6">
      <MatchCreateStepNav step={step} onStepChange={setStep} />

      <MatchCreateHiddenFields
        draft={draft}
        summary={summary}
        includeAdjustment={step === "adjustment"}
      />

      <MatchCreateStepContent
        currentStepAccess={currentStepAccess}
        dispatch={dispatch}
        draft={draft}
        formationTemplates={formationTemplates}
        nextGuestPriorityRank={nextGuestPriorityRank}
        participantErrors={participantErrors}
        participantSetupMessage={participantSetupMessage}
        players={players}
        setStep={setStep}
        state={state}
        step={step}
        summary={summary}
      />

      {state.message && (
        <p className="text-mismatch rounded-lg bg-orange-50 px-3 py-2 text-sm">
          {state.message}
        </p>
      )}

      <MatchCreateFooter
        step={step}
        canSubmit={currentStepAccess.canEnter && summary.canSubmit}
        onStepChange={setStep}
      />
    </form>
  );
}

function MatchCreateStepContent({
  currentStepAccess,
  dispatch,
  draft,
  formationTemplates,
  nextGuestPriorityRank,
  participantErrors,
  participantSetupMessage,
  players,
  setStep,
  state,
  step,
  summary,
}: {
  currentStepAccess: StepAccess[MatchCreateStep];
  dispatch: Dispatch<MatchDraftAction>;
  draft: MatchDraft;
  formationTemplates: FormationTemplate[];
  nextGuestPriorityRank: number;
  participantErrors: string[];
  participantSetupMessage?: string;
  players: Player[];
  setStep: (step: MatchCreateStep) => void;
  state: MatchCreateState;
  step: MatchCreateStep;
  summary: MatchDraftSummary;
}) {
  if (!currentStepAccess.canEnter) {
    return (
      <MatchCreateStepGuard
        stepAccess={currentStepAccess}
        onStepChange={setStep}
      />
    );
  }

  if (step === "info") {
    return (
      <MatchInfoStep
        formationTemplates={formationTemplates}
        info={draft.info}
        state={state}
        onInfoChange={(patch) => dispatch({ patch, type: "setInfo" })}
      />
    );
  }

  if (step === "participants") {
    return (
      <ParticipantsStep
        guestPlayers={draft.guestPlayers}
        errors={participantErrors}
        nextPriorityRank={nextGuestPriorityRank}
        players={players}
        selectedRegisteredPlayerIds={draft.selectedRegisteredPlayerIds}
        setupMessage={participantSetupMessage}
        summary={summary}
        actions={{
          addGuestPlayer: (guest) => dispatch({ guest, type: "addGuestPlayer" }),
          editGuestPlayer: (guest) =>
            dispatch({ guest, type: "editGuestPlayer" }),
          removeGuestPlayer: (guestId) =>
            dispatch({ guestId, type: "removeGuestPlayer" }),
          setSelectedRegisteredPlayers: (playerIds) =>
            dispatch({ playerIds, type: "setSelectedRegisteredPlayers" }),
          toggleRegisteredPlayer: (playerId) =>
            dispatch({ playerId, type: "toggleRegisteredPlayer" }),
        }}
      />
    );
  }

  return (
    <AdjustmentStep
      gkFixed={draft.info.gkFixed}
      playtimeAdjustmentPlayerIds={draft.playtimeAdjustmentPlayerIds}
      quarterCount={draft.info.quarterCount}
      stateError={state.errors?.reducedPlayerIds?.[0]}
      summary={summary}
      onPlaytimeAdjustmentPlayersChange={(playerIds) =>
        dispatch({ playerIds, type: "setPlaytimeAdjustmentPlayers" })
      }
    />
  );
}
