import type { AssignmentSummaryItem } from "@/features/formation-editor/model/types";
import { Badge, Panel } from "@/shared/ui";
import { PlayerDisplayName } from "./PlayerDisplayName";

type AssignmentSummaryProps = {
  assignmentItems: AssignmentSummaryItem[];
  playerCount: number;
  quarterCount: number;
};

/**
 * 전체 쿼터 기준 선수별 출전 쿼터 목록을 요약해서 보여줍니다.
 */
export function AssignmentSummary({
  assignmentItems,
  playerCount,
  quarterCount,
}: AssignmentSummaryProps) {
  return (
    <Panel
      title="전체 배정 요약"
      description="전체 쿼터 기준 선수별 출전 쿼터입니다."
      actions={
        <p className="text-sm font-semibold text-primary">
          {quarterCount}쿼터 · {playerCount}명
        </p>
      }
    >
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {assignmentItems.map(({ player, quarterNumbers }) => (
          <div
            key={player.id}
            className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <span className="min-w-0">
              <PlayerDisplayName
                player={player}
                className="block truncate font-semibold text-foreground"
              />
            </span>
            <span className="flex shrink-0 flex-wrap justify-end gap-1">
              {quarterNumbers.length > 0 ? (
                quarterNumbers.map((quarterNumber) => (
                  <Badge key={quarterNumber} variant="primary">
                    {quarterNumber}Q
                  </Badge>
                ))
              ) : (
                <Badge>미배정</Badge>
              )}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
