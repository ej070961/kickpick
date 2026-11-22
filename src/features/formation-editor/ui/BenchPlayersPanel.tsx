"use client";

import { useMemo } from "react";
import { sortPlayersForBench } from "@/features/formation-editor/lib/assignmentSummary";
import { useEditorStore } from "@/features/formation-editor/model/store";
import { Badge, Panel } from "@/shared/ui";
import { PlayerDisplayName } from "./PlayerDisplayName";

type Props = {
  isDisabled: boolean;
};

/**
 * 현재 쿼터에 출전하지 않는 후보 선수 목록과 교체 진입점을 제공합니다.
 */
export const BenchPlayersPanel = ({ isDisabled }: Props) => {
  const playersById = useEditorStore((state) => state.playersById);
  const players = useMemo(() => Object.values(playersById), [playersById]);
  const quartersByNumber = useEditorStore((state) => state.quartersByNumber);
  const selectedQuarter = useEditorStore((state) => state.selectedQuarter);
  const selection = useEditorStore((state) => state.selection);
  const selectBenchPlayer = useEditorStore((state) => state.selectBenchPlayer);
  const activeQuarter = quartersByNumber[selectedQuarter];
  const selectedSlotId = selection?.type === "slot" ? selection.id : null;
  const selectedBenchPlayerId =
    selection?.type === "bench" ? selection.id : null;
  const assignedPlayerIds = useMemo(
    () =>
      new Set(
        activeQuarter?.slots
          .map((slot) => slot.playerId)
          .filter((playerId): playerId is NonNullable<typeof playerId> =>
            Boolean(playerId),
          ) ?? [],
      ),
    [activeQuarter],
  );
  const benchPlayers = useMemo(
    () =>
      sortPlayersForBench(
        players.filter((player) => !assignedPlayerIds.has(player.id)),
      ),
    [assignedPlayerIds, players],
  );

  return (
    <Panel
      title="현재 쿼터 후보"
      description={`${selectedQuarter}Q · 출전 ${assignedPlayerIds.size}명 · 후보 ${benchPlayers.length}명`}
    >
      <p className="text-muted mt-2 text-xs">
        {selectedSlotId
          ? "후보 카드를 누르면 선택한 유니폼과 교체됩니다."
          : selectedBenchPlayerId
            ? "교체할 유니폼을 누르면 선택한 후보가 들어갑니다."
            : "유니폼 또는 후보 카드를 먼저 선택하세요."}
      </p>
      {benchPlayers.length > 0 ? (
        <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
          {benchPlayers.map((player) => {
            const isSelected = selectedBenchPlayerId === player.id;

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => selectBenchPlayer(player.id)}
                disabled={isDisabled}
                className={`focus-visible:outline-primary flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isSelected
                    ? "border-primary bg-mint-surface"
                    : "border-border hover:border-primary hover:bg-mint-surface"
                }`}
                aria-pressed={isSelected}
                aria-label={`${player.name} 후보 선수 교체`}
              >
                <span className="min-w-0">
                  <PlayerDisplayName
                    player={player}
                    className="text-foreground block truncate font-semibold"
                  />
                </span>
                <Badge>{player.mainPosition}</Badge>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="border-border text-muted mt-3 rounded-lg border border-dashed px-3 py-3 text-sm">
          후보 선수가 없습니다.
        </p>
      )}
    </Panel>
  );
};
