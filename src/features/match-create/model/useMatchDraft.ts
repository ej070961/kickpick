"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import type { FormationTemplate } from "@/entities/formation";
import type { Player } from "@/entities/player";
import { createInitialMatchDraft } from "./matchDraft";
import type { MatchDraft } from "./matchDraft";
import { matchDraftReducer } from "./matchDraftReducer";
import {
  getDefaultPlaytimeAdjustmentPlayerIds,
  getMatchDraftSummary,
  getStepAccess,
} from "./matchDraftSelectors";
import { loadStoredMatchDraft, storeMatchDraft } from "./matchDraftStorage";

/**
 * 경기 생성 화면의 draft 상태, 파생 요약, 단계 접근 가능 여부를 한 곳에서 관리한다.
 *
 * 컴포넌트는 이 hook을 통해 사용자 action만 dispatch하고, 출전 조정 기본값 재계산과
 * 새로고침 대비 임시 저장은 hook 내부 정책으로 처리한다.
 */
export function useMatchDraft({
  formationTemplates,
  players,
}: {
  formationTemplates: FormationTemplate[];
  players: Player[];
}) {
  const didLoadDraftRef = useRef(false);
  const didSkipInitialStoreRef = useRef(false);
  const playtimeAdjustmentBasisKeyRef = useRef<string | null>(null);
  const shouldSkipNextPlaytimeResetRef = useRef(false);
  const [draft, dispatch] = useReducer(
    matchDraftReducer,
    { formationTemplates, players },
    createInitialMatchDraft,
  );
  const summary = useMemo(
    () => getMatchDraftSummary({ draft, formationTemplates, players }),
    [draft, formationTemplates, players],
  );
  const stepAccess = useMemo(
    () => getStepAccess({ draft, summary }),
    [draft, summary],
  );
  const playtimeAdjustmentBasisKey = getPlaytimeAdjustmentBasisKey(draft);
  const defaultPlaytimeAdjustmentPlayerIds = useMemo(
    () => getDefaultPlaytimeAdjustmentPlayerIds(summary),
    [summary],
  );

  useEffect(() => {
    const loadedDraft = loadStoredMatchDraft({ formationTemplates, players });
    didLoadDraftRef.current = true;
    shouldSkipNextPlaytimeResetRef.current = true;

    if (!loadedDraft.shouldResetPlaytimeAdjustment) {
      playtimeAdjustmentBasisKeyRef.current = getPlaytimeAdjustmentBasisKey(
        loadedDraft.draft,
      );
    }

    dispatch({
      draft: loadedDraft.draft,
      type: "replaceDraft",
    });
  }, [formationTemplates, players]);

  useEffect(() => {
    if (!didLoadDraftRef.current) return;

    if (shouldSkipNextPlaytimeResetRef.current) {
      shouldSkipNextPlaytimeResetRef.current = false;
      return;
    }

    if (playtimeAdjustmentBasisKeyRef.current === playtimeAdjustmentBasisKey) {
      return;
    }

    playtimeAdjustmentBasisKeyRef.current = playtimeAdjustmentBasisKey;
    dispatch({
      playerIds: defaultPlaytimeAdjustmentPlayerIds,
      type: "resetPlaytimeAdjustment",
    });
  }, [defaultPlaytimeAdjustmentPlayerIds, playtimeAdjustmentBasisKey]);

  useEffect(() => {
    if (!didLoadDraftRef.current) return;

    if (!didSkipInitialStoreRef.current) {
      didSkipInitialStoreRef.current = true;
      return;
    }

    storeMatchDraft(draft);
  }, [draft]);

  return { dispatch, draft, stepAccess, summary };
}

/**
 * 출전 조정 기본 선택값을 다시 계산해야 하는 경기 조건과 참가 명단만 key로 만든다.
 *
 * `playtimeAdjustmentPlayerIds`는 사용자가 조작하는 결과값이므로 포함하지 않는다.
 */
function getPlaytimeAdjustmentBasisKey(draft: MatchDraft) {
  const guestKey = draft.guestPlayers
    .map((guest) =>
      [
        guest.id,
        guest.name,
        guest.mainPosition,
        guest.priorityRank,
        guest.subPositions.join(","),
      ].join(":"),
    )
    .join("|");

  return [
    draft.info.formationKey,
    draft.info.gkFixed,
    draft.info.quarterCount,
    draft.selectedRegisteredPlayerIds.join(","),
    guestKey,
  ].join("::");
}
