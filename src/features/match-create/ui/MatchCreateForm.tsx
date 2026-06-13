"use client";

import { useActionState, useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";
import type { FormationTemplate } from "@/entities/formation";
import type { Player } from "@/entities/player";
import {
  createMatch,
  type MatchCreateState,
} from "@/features/match-create/actions/matchCreateActions";
import {
  getDefaultQuotaPlayerIds,
  getQuotaPlayers,
  getQuotaSelectionCount,
  getQuotaSelectionType,
  getQuotaSlotsPerQuarter,
  getReducedPlayerIdsFromQuotaSelection,
} from "@/features/match-create/model/quotaSelection";
import {
  mapGuestDraftToParticipant,
  mapRosterPlayerToParticipant,
  type GuestPlayerDraft,
  type MatchCreateParticipant,
  type SerializedGuestPlayer,
} from "@/features/match-create/model/types";
import { SubmitButton } from "@/features/player-manage/ui/SubmitButton";
import { GuestPlayerModal } from "./GuestPlayerModal";
import { MatchInfoFields } from "./MatchInfoFields";
import { PlayerSelectionModal } from "./PlayerSelectionModal";
import { ReducedQuotaSelector } from "./ReducedQuotaSelector";
import { StepIndicator } from "./StepIndicator";

type MatchCreateFormProps = {
  formationTemplates: FormationTemplate[];
  players: Player[];
};

const initialState: MatchCreateState = {};
const DEFAULT_QUARTER_COUNT = 4;
const DEFAULT_GK_FIXED = true;

/**
 * 현재 경기 설정값을 기준으로 기본 쿼터 보정 선수 선택값을 계산합니다.
 */
function getDefaultQuotaSelection({
  formationTemplate,
  gkFixed,
  players,
  quarterCount,
}: {
  formationTemplate: FormationTemplate | undefined;
  gkFixed: boolean;
  players: MatchCreateParticipant[];
  quarterCount: number;
}) {
  const slotsPerQuarter = formationTemplate?.slots.length ?? 0;
  const quotaSlotsPerQuarter = getQuotaSlotsPerQuarter({
    gkFixed,
    slotsPerQuarter,
  });
  const { quotaPlayers } = getQuotaPlayers({ gkFixed, players });
  const selectionType = getQuotaSelectionType({
    playerCount: quotaPlayers.length,
    quarterCount,
    slotsPerQuarter: quotaSlotsPerQuarter,
  });
  const requiredCount = getQuotaSelectionCount({
    playerCount: quotaPlayers.length,
    quarterCount,
    slotsPerQuarter: quotaSlotsPerQuarter,
  });

  return getDefaultQuotaPlayerIds({
    players: quotaPlayers,
    requiredCount,
    selectionType,
  });
}

/**
 * 새 경기 생성 폼입니다.
 *
 * 기본 경기 정보 입력, 참가 선수 선택, 쿼터 보정 대상 선택을 하나의 서버 액션 제출 흐름으로 연결합니다.
 */
export function MatchCreateForm({
  formationTemplates,
  players,
}: MatchCreateFormProps) {
  const [state, action] = useActionState(createMatch, initialState);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [quarterCount, setQuarterCount] = useState(DEFAULT_QUARTER_COUNT);
  const [formationKey, setFormationKey] = useState(
    formationTemplates[0]?.key ?? "",
  );
  const [gkFixed, setGkFixed] = useState(DEFAULT_GK_FIXED);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    () => new Set(players.map((player) => player.id)),
  );
  const [guestPlayers, setGuestPlayers] = useState<GuestPlayerDraft[]>([]);
  const selectedRosterPlayers = useMemo(
    () =>
      players
        .filter((player) => selectedPlayerIds.has(player.id))
        .map(mapRosterPlayerToParticipant),
    [players, selectedPlayerIds],
  );
  const guestParticipants = useMemo(
    () => guestPlayers.map(mapGuestDraftToParticipant),
    [guestPlayers],
  );
  const selectedPlayers = useMemo(
    () => [...selectedRosterPlayers, ...guestParticipants],
    [guestParticipants, selectedRosterPlayers],
  );
  const [quotaPlayerIds, setQuotaPlayerIds] = useState(() =>
    getDefaultQuotaSelection({
      formationTemplate: formationTemplates[0],
      gkFixed: DEFAULT_GK_FIXED,
      players: players.map(mapRosterPlayerToParticipant),
      quarterCount: DEFAULT_QUARTER_COUNT,
    }),
  );
  const formationPreset =
    formationTemplates.find((preset) => preset.key === formationKey) ??
    formationTemplates[0];
  const slotsPerQuarter = formationPreset?.slots.length ?? 0;
  const quotaSlotsPerQuarter = getQuotaSlotsPerQuarter({
    gkFixed,
    slotsPerQuarter,
  });
  const { quotaPlayers } = useMemo(
    () => getQuotaPlayers({ gkFixed, players: selectedPlayers }),
    [gkFixed, selectedPlayers],
  );
  const quotaSelectionType = getQuotaSelectionType({
    playerCount: quotaPlayers.length,
    quarterCount,
    slotsPerQuarter: quotaSlotsPerQuarter,
  });
  const requiredQuotaSelectionCount = getQuotaSelectionCount({
    playerCount: quotaPlayers.length,
    quarterCount,
    slotsPerQuarter: quotaSlotsPerQuarter,
  });
  const reducedPlayerIds = useMemo(
    () =>
      getReducedPlayerIdsFromQuotaSelection({
        quotaPlayerIds,
        selectedPlayers: quotaPlayers,
        selectionType: quotaSelectionType,
      }),
    [quotaPlayerIds, quotaPlayers, quotaSelectionType],
  );
  const canCreateMatch = quotaPlayerIds.size === requiredQuotaSelectionCount;
  const nextGuestPriorityRank =
    Math.max(
      0,
      ...selectedRosterPlayers.map((player) => player.priorityRank),
      ...guestPlayers.map((player) => player.priorityRank),
    ) + 1;
  const serializedGuestPlayers: SerializedGuestPlayer[] = guestPlayers.map(
    (guest) => ({
      clientId: guest.id,
      mainPosition: guest.mainPosition,
      name: guest.name,
      playerNumber: guest.playerNumber,
      subPositions: guest.subPositions,
    }),
  );
  const setupError =
    selectedPlayers.length < slotsPerQuarter
      ? `${formationPreset?.label ?? "선택한"} 포메이션은 최소 ${slotsPerQuarter}명이 필요합니다.`
      : null;
  const canProceed = !setupError && quarterCount >= 1 && quarterCount <= 8;

  /**
   * 변경된 경기 설정값을 기준으로 쿼터 보정 기본 선택값을 다시 계산합니다.
   */
  function resetQuotaPlayers({
    nextFormationKey = formationKey,
    nextGkFixed = gkFixed,
    nextQuarterCount = quarterCount,
    nextSelectedPlayerIds = selectedPlayerIds,
    nextGuestPlayers = guestPlayers,
  }: {
    nextFormationKey?: string;
    nextGkFixed?: boolean;
    nextGuestPlayers?: GuestPlayerDraft[];
    nextQuarterCount?: number;
    nextSelectedPlayerIds?: Set<string>;
  }) {
    const nextPreset =
      formationTemplates.find((preset) => preset.key === nextFormationKey) ??
      formationTemplates[0];
    const nextSelectedPlayers = [
      ...players
        .filter((player) => nextSelectedPlayerIds.has(player.id))
        .map(mapRosterPlayerToParticipant),
      ...nextGuestPlayers.map(mapGuestDraftToParticipant),
    ];

    setQuotaPlayerIds(
      getDefaultQuotaSelection({
        formationTemplate: nextPreset,
        gkFixed: nextGkFixed,
        players: nextSelectedPlayers,
        quarterCount: nextQuarterCount,
      }),
    );
  }

  /**
   * 포메이션 변경 후 새 슬롯 수에 맞춰 쿼터 보정 선택값을 갱신합니다.
   */
  function handleFormationChange(value: string) {
    setFormationKey(value);
    resetQuotaPlayers({ nextFormationKey: value });
  }

  /**
   * 쿼터 수 변경 후 전체 슬롯 수에 맞춰 쿼터 보정 선택값을 갱신합니다.
   */
  function handleQuarterCountChange(value: number) {
    setQuarterCount(value);
    resetQuotaPlayers({ nextQuarterCount: value });
  }

  /**
   * GK 고정 여부 변경 후 GK 제외 계산 기준에 맞춰 쿼터 보정 선택값을 갱신합니다.
   */
  function handleGkFixedChange(value: boolean) {
    setGkFixed(value);
    resetQuotaPlayers({ nextGkFixed: value });
  }

  /**
   * 참가 선수 변경 후 보정 대상 선수 목록을 새 참가자 기준으로 갱신합니다.
   */
  function handleSelectedPlayerIdsChange(nextPlayerIds: Set<string>) {
    setSelectedPlayerIds(nextPlayerIds);
    resetQuotaPlayers({ nextSelectedPlayerIds: nextPlayerIds });
  }

  /**
   * 용병 변경 후 참가자 전체 기준으로 보정 대상 기본 선택값을 갱신합니다.
   */
  function handleGuestPlayersChange(nextGuestPlayers: GuestPlayerDraft[]) {
    setGuestPlayers(nextGuestPlayers);
    resetQuotaPlayers({ nextGuestPlayers });
  }

  /**
   * 1단계 입력 검증을 통과하면 쿼터 보정 단계로 이동합니다.
   */
  function proceedToReducedQuotaStep() {
    if (!canProceed) return;
    resetQuotaPlayers({});
    setStep(2);
  }

  return (
    <form action={action} className="space-y-6">
      <StepIndicator step={step} />

      {step === 2 ? (
        <>
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="matchDate" value={matchDate} />
          <input type="hidden" name="quarterCount" value={quarterCount} />
          <input type="hidden" name="formation" value={formationKey} />
          {gkFixed ? <input type="hidden" name="gkFixed" value="on" /> : null}
        </>
      ) : null}

      {selectedPlayers.map((player) => (
        <input key={player.id} type="hidden" name="playerKeys" value={player.id} />
      ))}
      <input
        type="hidden"
        name="guestPlayers"
        value={JSON.stringify(serializedGuestPlayers)}
      />
      {step === 2
        ? reducedPlayerIds.map((playerId) => (
            <input
              key={playerId}
              type="hidden"
              name="reducedPlayerIds"
              value={playerId}
            />
          ))
        : null}

      {step === 1 ? (
        <>
          <MatchInfoFields
            formationKey={formationKey}
            formationTemplates={formationTemplates}
            gkFixed={gkFixed}
            matchDate={matchDate}
            name={name}
            onFormationChange={handleFormationChange}
            onGkFixedChange={handleGkFixedChange}
            onMatchDateChange={setMatchDate}
            onNameChange={setName}
            onQuarterCountChange={handleQuarterCountChange}
            quarterCount={quarterCount}
            state={state}
          />

          <PlayerSelectionModal
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            onSelectedPlayerIdsChange={handleSelectedPlayerIdsChange}
            actionSlot={
              <GuestPlayerModal
                guestPlayers={guestPlayers}
                nextPriorityRank={nextGuestPriorityRank}
                onGuestPlayersChange={handleGuestPlayersChange}
              />
            }
            guestCount={guestPlayers.length}
          />
          {setupError ? (
            <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-mismatch">
              {setupError}
            </p>
          ) : null}
          {state.errors?.playerIds ? (
            <span className="block text-xs text-mismatch">
              {state.errors.playerIds[0]}
            </span>
          ) : null}
          {state.errors?.playerKeys ? (
            <span className="block text-xs text-mismatch">
              {state.errors.playerKeys[0]}
            </span>
          ) : null}
          {state.errors?.guestPlayers ? (
            <span className="block text-xs text-mismatch">
              {state.errors.guestPlayers[0]}
            </span>
          ) : null}
        </>
      ) : (
        <ReducedQuotaSelector
          formationLabel={formationPreset?.label ?? formationKey}
          gkFixed={gkFixed}
          quarterCount={quarterCount}
          quotaPlayerIds={quotaPlayerIds}
          quotaSelectionType={quotaSelectionType}
          requiredCount={requiredQuotaSelectionCount}
          selectedPlayers={quotaPlayers}
          slotsPerQuarter={quotaSlotsPerQuarter}
          onQuotaPlayerIdsChange={setQuotaPlayerIds}
        />
      )}

      {state.errors?.reducedPlayerIds ? (
        <span className="block text-xs text-mismatch">
          {state.errors.reducedPlayerIds[0]}
        </span>
      ) : null}

      {state.message ? (
        <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-mismatch">
          {state.message}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:justify-end lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
        {step === 1 ? (
          <button
            type="button"
            onClick={proceedToReducedQuotaStep}
            disabled={!canProceed}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-45 sm:w-auto"
          >
            다음
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground sm:w-auto"
            >
              이전
            </button>
            <SubmitButton
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
              disabled={!canCreateMatch}
              pendingLabel="생성 중"
            >
              <CalendarPlus size={18} aria-hidden="true" />
              경기 생성
            </SubmitButton>
          </>
        )}
      </div>
    </form>
  );
}
