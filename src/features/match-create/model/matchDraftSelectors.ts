import type { FormationTemplate } from "@/entities/formation";
import type { Player } from "@/entities/player";
import {
  getDefaultQuotaPlayerIds,
  getQuotaPlayers,
  getQuotaSelectionCount,
  getQuotaSelectionType,
  getQuotaSlotsPerQuarter,
  getReducedPlayerIdsFromQuotaSelection,
  type QuotaSelectionType,
} from "./quotaSelection";
import type { MatchCreateStep, MatchDraft } from "./matchDraft";
import {
  mapGuestDraftToParticipant,
  mapRosterPlayerToParticipant,
  type MatchCreateParticipant,
  type SerializedGuestPlayer,
} from "./types";

export type PlaytimeAdjustmentType = "more" | "less";

export type MatchDraftSummary = {
  canSubmit: boolean;
  currentFormation: FormationTemplate | undefined;
  fixedGoalkeeper: MatchCreateParticipant | undefined;
  guestCount: number;
  hasGoalkeeper: boolean;
  participants: MatchCreateParticipant[];
  playtimeAdjustmentCandidates: MatchCreateParticipant[];
  playtimeAdjustmentType: PlaytimeAdjustmentType;
  playtimeSlotsPerQuarter: number;
  requiredPlaytimeAdjustmentCount: number;
  selectedRegisteredPlayerCount: number;
  selectedRegisteredPlayers: MatchCreateParticipant[];
  slotsPerQuarter: number;
  totalParticipantCount: number;
};

export type StepAccess = Record<
  MatchCreateStep,
  {
    canEnter: boolean;
    message?: string;
    requiredStep?: MatchCreateStep;
    title?: string;
  }
>;

/**
 * draft와 서버에서 받은 선수/포메이션 목록으로 화면에 필요한 파생값을 만든다.
 *
 * 이 함수는 UI state를 만들지 않고 계산 결과만 반환한다. `MatchCreateForm`은 이
 * 결과를 읽어 단계 가드, hidden input, 제출 가능 여부를 판단한다.
 */
export function getMatchDraftSummary({
  draft,
  formationTemplates,
  players,
}: {
  draft: MatchDraft;
  formationTemplates: FormationTemplate[];
  players: Player[];
}): MatchDraftSummary {
  const currentFormation =
    formationTemplates.find(
      (formation) => formation.key === draft.info.formationKey,
    ) ?? formationTemplates[0];
  const selectedRegisteredIdSet = new Set(draft.selectedRegisteredPlayerIds);
  const selectedRegisteredPlayers = players
    .filter((player) => selectedRegisteredIdSet.has(player.id))
    .map(mapRosterPlayerToParticipant);
  const guestPlayers = draft.guestPlayers.map(mapGuestDraftToParticipant);
  const participants = [...selectedRegisteredPlayers, ...guestPlayers];
  const slotsPerQuarter = currentFormation?.slots.length ?? 0;
  const playtimeSlotsPerQuarter = getQuotaSlotsPerQuarter({
    gkFixed: draft.info.gkFixed,
    slotsPerQuarter,
  });
  const { fixedGoalkeeper, quotaPlayers } = getQuotaPlayers({
    gkFixed: draft.info.gkFixed,
    players: participants,
  });
  const quotaSelectionType = getQuotaSelectionType({
    playerCount: quotaPlayers.length,
    quarterCount: draft.info.quarterCount,
    slotsPerQuarter: playtimeSlotsPerQuarter,
  });
  const requiredPlaytimeAdjustmentCount = getQuotaSelectionCount({
    playerCount: quotaPlayers.length,
    quarterCount: draft.info.quarterCount,
    slotsPerQuarter: playtimeSlotsPerQuarter,
  });
  const playtimeAdjustmentCandidateIdSet = new Set(
    quotaPlayers.map((player) => player.id),
  );
  const hasValidPlaytimeAdjustmentSelection =
    draft.playtimeAdjustmentPlayerIds.length ===
      requiredPlaytimeAdjustmentCount &&
    draft.playtimeAdjustmentPlayerIds.every((playerId) =>
      playtimeAdjustmentCandidateIdSet.has(playerId),
    );

  return {
    canSubmit: hasValidPlaytimeAdjustmentSelection,
    currentFormation,
    fixedGoalkeeper,
    guestCount: draft.guestPlayers.length,
    hasGoalkeeper: participants.some((player) => player.mainPosition === "GK"),
    participants,
    playtimeAdjustmentCandidates: quotaPlayers,
    playtimeAdjustmentType: toPlaytimeAdjustmentType(quotaSelectionType),
    playtimeSlotsPerQuarter,
    requiredPlaytimeAdjustmentCount,
    selectedRegisteredPlayerCount: selectedRegisteredPlayers.length,
    selectedRegisteredPlayers,
    slotsPerQuarter,
    totalParticipantCount: participants.length,
  };
}

/**
 * 각 단계가 현재 draft 상태에서 열릴 수 있는지와 막힌 이유를 반환한다.
 */
export function getStepAccess({
  draft,
  summary,
}: {
  draft: MatchDraft;
  summary: MatchDraftSummary;
}): StepAccess {
  const hasValidInfo =
    Boolean(draft.info.matchDate) &&
    Boolean(summary.currentFormation) &&
    draft.info.quarterCount >= 1 &&
    draft.info.quarterCount <= 8;
  const participantMessage =
    summary.totalParticipantCount < summary.slotsPerQuarter
      ? `${summary.currentFormation?.label ?? "선택한"} 포메이션은 최소 ${summary.slotsPerQuarter}명이 필요해요.`
      : draft.info.gkFixed && !summary.hasGoalkeeper
        ? "GK 고정을 사용하려면 참가 명단에 골키퍼가 있어야 해요."
        : undefined;
  const hasValidParticipants = hasValidInfo && !participantMessage;

  return {
    adjustment: hasValidParticipants
      ? { canEnter: true }
      : {
          canEnter: false,
          message:
            participantMessage ??
            "포메이션과 쿼터 수를 정해야 출전 조정을 할 수 있어요.",
          requiredStep: participantMessage ? "participants" : "info",
          title: participantMessage
            ? "참가 명단을 먼저 완성해주세요."
            : "경기 정보를 먼저 확인해주세요.",
        },
    info: { canEnter: true },
    participants: hasValidInfo
      ? { canEnter: true }
      : {
          canEnter: false,
          message: "포메이션, 날짜, 쿼터 수를 먼저 확인해주세요.",
          requiredStep: "info",
          title: "경기 정보를 먼저 확인해주세요.",
        },
  };
}

/**
 * 현재 경기 조건과 참가자 기준으로 기본 출전 조정 대상 선수 id를 고른다.
 */
export function getDefaultPlaytimeAdjustmentPlayerIds(
  summary: MatchDraftSummary,
) {
  return [
    ...getDefaultQuotaPlayerIds({
      players: summary.playtimeAdjustmentCandidates,
      requiredCount: summary.requiredPlaytimeAdjustmentCount,
      selectionType: toQuotaSelectionType(summary.playtimeAdjustmentType),
    }),
  ];
}

/**
 * UI의 출전 조정 선택값을 서버 액션이 요구하는 `reducedPlayerIds`로 변환한다.
 */
export function getReducedPlayerIdsForSubmit({
  draft,
  summary,
}: {
  draft: MatchDraft;
  summary: MatchDraftSummary;
}) {
  return getReducedPlayerIdsFromQuotaSelection({
    quotaPlayerIds: new Set(draft.playtimeAdjustmentPlayerIds),
    selectedPlayers: summary.playtimeAdjustmentCandidates,
    selectionType: toQuotaSelectionType(summary.playtimeAdjustmentType),
  });
}

/**
 * 게스트 draft를 서버 액션 hidden input에 넣기 쉬운 JSON payload로 바꾼다.
 */
export function getSerializedGuestPlayers(
  draft: MatchDraft,
): SerializedGuestPlayer[] {
  return draft.guestPlayers.map((guest) => ({
    clientId: guest.id,
    mainPosition: guest.mainPosition,
    name: guest.name,
    playerNumber: guest.playerNumber,
    subPositions: guest.subPositions,
  }));
}

function toPlaytimeAdjustmentType(
  selectionType: QuotaSelectionType,
): PlaytimeAdjustmentType {
  return selectionType === "increased" ? "more" : "less";
}

function toQuotaSelectionType(
  adjustmentType: PlaytimeAdjustmentType,
): QuotaSelectionType {
  return adjustmentType === "more" ? "increased" : "reduced";
}
