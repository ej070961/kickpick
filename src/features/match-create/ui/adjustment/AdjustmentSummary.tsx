import type { MatchDraftSummary } from "@/features/match-create/model/matchDraftSelectors";

type Props = {
  gkFixed: boolean;
  quarterCount: number;
  summary: MatchDraftSummary;
};

/**
 * 출전 조정 계산에 영향을 주는 경기 조건을 한 줄 요약 카드로 보여준다.
 */
export function AdjustmentSummary({ gkFixed, quarterCount, summary }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      <SummaryItem
        label="사용 포메이션"
        value={summary.currentFormation?.label ?? "선택 필요"}
      />
      <SummaryItem label="경기 쿼터" value={`${quarterCount}개`} />
      <SummaryItem
        label="나눠 뛸 선수"
        value={`${summary.playtimeAdjustmentCandidates.length}명`}
      />
      <SummaryItem
        label="골키퍼"
        value={gkFixed ? "전 쿼터 고정" : "쿼터별 배분"}
      />
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-background rounded-lg border px-3 py-2">
      <p className="text-muted text-xs font-medium">{label}</p>
      <p className="text-foreground mt-1 text-sm font-bold leading-5">
        {value}
      </p>
    </div>
  );
}
