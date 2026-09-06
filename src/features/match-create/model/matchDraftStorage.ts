import type { FormationTemplate } from "@/entities/formation";
import type { Player } from "@/entities/player";
import {
  PLAYER_POSITION_CODES,
  type PlayerPositionCode,
} from "@/entities/position";
import { getMatchDraftSummary } from "./matchDraftSelectors";
import { createInitialMatchDraft, type MatchDraft } from "./matchDraft";

export const MATCH_DRAFT_STORAGE_KEY = "kickpick:match-create-draft:v1";

type LoadStoredMatchDraftResult = {
  draft: MatchDraft;
  shouldResetPlaytimeAdjustment: boolean;
};

/**
 * sessionStorage에서 경기 생성 draft를 읽고 현재 선수/포메이션 목록에 맞게 정리한다.
 *
 * 저장된 포메이션이나 선수 id가 더 이상 존재하지 않으면 제거해, 새로고침 복구 후에도
 * 서버 액션에 유효하지 않은 값을 제출하지 않게 한다.
 */
export function loadStoredMatchDraft({
  formationTemplates,
  players,
}: {
  formationTemplates: FormationTemplate[];
  players: Player[];
}): LoadStoredMatchDraftResult {
  const fallback = createInitialMatchDraft({ formationTemplates, players });

  if (typeof window === "undefined") {
    return { draft: fallback, shouldResetPlaytimeAdjustment: true };
  }

  try {
    const storedValue = window.sessionStorage.getItem(MATCH_DRAFT_STORAGE_KEY);
    if (!storedValue) {
      return { draft: fallback, shouldResetPlaytimeAdjustment: true };
    }

    return sanitizeMatchDraft({
      draft: JSON.parse(storedValue) as Partial<MatchDraft>,
      fallback,
      formationTemplates,
      players,
    });
  } catch {
    return { draft: fallback, shouldResetPlaytimeAdjustment: true };
  }
}

/**
 * 현재 draft를 탭 단위 임시 저장소에 저장한다.
 */
export function storeMatchDraft(draft: MatchDraft) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(MATCH_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function sanitizeMatchDraft({
  draft,
  fallback,
  formationTemplates,
  players,
}: {
  draft: Partial<MatchDraft>;
  fallback: MatchDraft;
  formationTemplates: FormationTemplate[];
  players: Player[];
}): LoadStoredMatchDraftResult {
  const playerIds = new Set(players.map((player) => player.id));
  const formationKeys = new Set(
    formationTemplates.map((formation) => formation.key),
  );
  const guestPlayers = sanitizeGuestPlayers(draft.guestPlayers);
  const selectedRegisteredPlayerIds = Array.isArray(
    draft.selectedRegisteredPlayerIds,
  )
    ? draft.selectedRegisteredPlayerIds.filter((playerId) =>
        playerIds.has(playerId),
      )
    : fallback.selectedRegisteredPlayerIds;

  const sanitizedDraft: MatchDraft = {
    guestPlayers,
    info: {
      formationKey:
        draft.info?.formationKey && formationKeys.has(draft.info.formationKey)
          ? draft.info.formationKey
          : fallback.info.formationKey,
      gkFixed:
        typeof draft.info?.gkFixed === "boolean"
          ? draft.info.gkFixed
          : fallback.info.gkFixed,
      matchDate:
        typeof draft.info?.matchDate === "string"
          ? draft.info.matchDate
          : fallback.info.matchDate,
      name:
        typeof draft.info?.name === "string"
          ? draft.info.name
          : fallback.info.name,
      quarterCount:
        typeof draft.info?.quarterCount === "number"
          ? draft.info.quarterCount
          : fallback.info.quarterCount,
    },
    playtimeAdjustmentPlayerIds: [],
    selectedRegisteredPlayerIds,
  };
  const playtimeAdjustment = sanitizePlaytimeAdjustmentPlayerIds({
    draft,
    formationTemplates,
    players,
    sanitizedDraft,
  });

  return {
    draft: {
      ...sanitizedDraft,
      playtimeAdjustmentPlayerIds: playtimeAdjustment.playerIds,
    },
    shouldResetPlaytimeAdjustment: playtimeAdjustment.shouldReset,
  };
}

const POSITION_CODE_SET = new Set<string>(PLAYER_POSITION_CODES);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeGuestPlayers(value: unknown): MatchDraft["guestPlayers"] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((guest) => {
    if (!guest || typeof guest !== "object") return [];

    const candidate = guest as Record<string, unknown>;
    const id = typeof candidate.id === "string" ? candidate.id : "";
    const name =
      typeof candidate.name === "string" ? candidate.name.trim() : "";
    const mainPosition =
      typeof candidate.mainPosition === "string" ? candidate.mainPosition : "";
    const priorityRank =
      typeof candidate.priorityRank === "number" ? candidate.priorityRank : 0;

    if (
      !UUID_PATTERN.test(id) ||
      !name ||
      !POSITION_CODE_SET.has(mainPosition) ||
      !Number.isInteger(priorityRank) ||
      priorityRank < 1
    ) {
      return [];
    }

    const subPositions = Array.isArray(candidate.subPositions)
      ? candidate.subPositions.filter(
          (position): position is PlayerPositionCode =>
            typeof position === "string" && POSITION_CODE_SET.has(position),
        )
      : [];

    return [
      {
        id,
        mainPosition: mainPosition as PlayerPositionCode,
        name,
        playerNumber: null,
        priorityRank,
        subPositions: [...new Set(subPositions)].filter(
          (position) => position !== mainPosition,
        ),
      },
    ];
  });
}

function sanitizePlaytimeAdjustmentPlayerIds({
  draft,
  formationTemplates,
  players,
  sanitizedDraft,
}: {
  draft: Partial<MatchDraft>;
  formationTemplates: FormationTemplate[];
  players: Player[];
  sanitizedDraft: MatchDraft;
}) {
  if (!Array.isArray(draft.playtimeAdjustmentPlayerIds)) {
    return { playerIds: [], shouldReset: true };
  }

  const summary = getMatchDraftSummary({
    draft: sanitizedDraft,
    formationTemplates,
    players,
  });
  const candidateIdSet = new Set(
    summary.playtimeAdjustmentCandidates.map((player) => player.id),
  );
  const uniquePlayerIds = [...new Set(draft.playtimeAdjustmentPlayerIds)];
  const playerIds = uniquePlayerIds.filter(
    (playerId): playerId is string =>
      typeof playerId === "string" && candidateIdSet.has(playerId),
  );
  const hasInvalidValue = playerIds.length !== uniquePlayerIds.length;
  const hasTooManyValues =
    playerIds.length > summary.requiredPlaytimeAdjustmentCount;

  return {
    playerIds: hasTooManyValues ? [] : playerIds,
    shouldReset: hasInvalidValue || hasTooManyValues,
  };
}
