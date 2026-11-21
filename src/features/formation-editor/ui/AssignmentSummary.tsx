"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { calculateAssignmentItems } from "@/features/formation-editor/lib/formationEditorSummary";
import { toQuarterList } from "@/features/formation-editor/lib/formationEditorQuarters";
import { useFormationEditorStore } from "@/features/formation-editor/model/formationEditorStore";
import { Badge, Button, Panel } from "@/shared/ui";
import { PlayerDisplayName } from "./PlayerDisplayName";

/**
 * 전체 쿼터 기준 선수별 출전 쿼터 목록을 요약해서 보여줍니다.
 */
export function AssignmentSummary() {
  const [isExpanded, setIsExpanded] = useState(true);
  const summaryId = useId();
  const players = useFormationEditorStore((state) => state.players);
  const quartersByNumber = useFormationEditorStore(
    (state) => state.quartersByNumber,
  );
  const quarters = useMemo(
    () => toQuarterList(quartersByNumber),
    [quartersByNumber],
  );
  const assignmentItems = useMemo(
    () => calculateAssignmentItems({ players, quarters }),
    [players, quarters],
  );
  const playerCount = players.length;
  const quarterCount = quarters.length;

  return (
    <Panel
      title="전체 배정 요약"
      description="전체 쿼터 기준 선수별 출전 쿼터입니다."
      actions={
        <Button
          aria-controls={summaryId}
          aria-expanded={isExpanded}
          className="text-primary min-h-10 gap-2 px-2"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          variant="ghost"
        >
          <span className="text-sm font-semibold">
            {quarterCount}쿼터 · {playerCount}명
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
            size={16}
          />
          <span className="sr-only">
            {isExpanded ? "배정 요약 접기" : "배정 요약 펼치기"}
          </span>
        </Button>
      }
    >
      <div className="mt-4" hidden={!isExpanded} id={summaryId}>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {assignmentItems.map(({ player, quarterNumbers }) => (
            <div
              key={player.id}
              className="border-border bg-background flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <PlayerDisplayName
                  player={player}
                  className="text-foreground block truncate font-semibold"
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
      </div>
    </Panel>
  );
}
