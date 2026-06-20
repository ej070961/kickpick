import type { EditorPlayer } from "@/features/formation-editor/model/types";
import { PlayerDisplayName } from "./PlayerDisplayName";

type BenchPlayersPanelProps = {
  activeAssignedPlayerCount: number;
  benchPlayers: EditorPlayer[];
  hasSelectedSlot: boolean;
  onBenchPlayerClick: (player: EditorPlayer) => void;
  quarterNumber: number;
  selectedBenchPlayerId: string | null;
};

/**
 * 현재 쿼터에 출전하지 않는 후보 선수 목록과 교체 진입점을 제공합니다.
 */
export function BenchPlayersPanel({
  activeAssignedPlayerCount,
  benchPlayers,
  hasSelectedSlot,
  onBenchPlayerClick,
  quarterNumber,
  selectedBenchPlayerId,
}: BenchPlayersPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">
        현재 쿼터 후보
      </h3>
      <p className="mt-1 text-sm text-muted">
        {quarterNumber}Q · 출전 {activeAssignedPlayerCount}명 · 후보{" "}
        {benchPlayers.length}명
      </p>
      <p className="mt-2 text-xs text-muted">
        {hasSelectedSlot
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
                onClick={() => onBenchPlayerClick(player)}
                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
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
                    className="block truncate font-semibold text-foreground"
                  />
                </span>
                <span className="shrink-0 text-xs font-semibold text-muted">
                  {player.mainPosition}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted">
          후보 선수가 없습니다.
        </p>
      )}
    </div>
  );
}
