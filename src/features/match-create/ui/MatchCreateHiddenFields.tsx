import {
  getReducedPlayerIdsForSubmit,
  getSerializedGuestPlayers,
  type MatchDraftSummary,
} from "@/features/match-create/model/matchDraftSelectors";
import type { MatchDraft } from "@/features/match-create/model/matchDraft";

type Props = {
  draft: MatchDraft;
  includeAdjustment: boolean;
  summary: MatchDraftSummary;
};

/**
 * 클라이언트 draft를 기존 Server Action이 받는 hidden input payload로 변환한다.
 *
 * UI에서는 직관적인 `playtimeAdjustmentPlayerIds`를 쓰고, 서버 제출 직전에만
 * `reducedPlayerIds`로 변환한다.
 */
export function MatchCreateHiddenFields({
  draft,
  includeAdjustment,
  summary,
}: Props) {
  const reducedPlayerIds = includeAdjustment
    ? getReducedPlayerIdsForSubmit({ draft, summary })
    : [];

  return (
    <>
      <input type="hidden" name="name" value={draft.info.name} />
      <input type="hidden" name="matchDate" value={draft.info.matchDate} />
      <input
        type="hidden"
        name="quarterCount"
        value={draft.info.quarterCount}
      />
      <input type="hidden" name="formation" value={draft.info.formationKey} />
      {draft.info.gkFixed && (
        <input type="hidden" name="gkFixed" value="on" />
      )}

      {summary.participants.map((player) => (
        <input
          key={player.id}
          type="hidden"
          name="playerKeys"
          value={player.id}
        />
      ))}
      <input
        type="hidden"
        name="guestPlayers"
        value={JSON.stringify(getSerializedGuestPlayers(draft))}
      />
      {reducedPlayerIds.map((playerId) => (
        <input
          key={playerId}
          type="hidden"
          name="reducedPlayerIds"
          value={playerId}
        />
      ))}
    </>
  );
}
