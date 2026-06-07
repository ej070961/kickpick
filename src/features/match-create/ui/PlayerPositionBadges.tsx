import type { Player } from "@/entities/player";

/**
 * 선수의 주 포지션과 부 포지션을 작은 배지 목록으로 렌더링합니다.
 */
export function PlayerPositionBadges({ player }: { player: Player }) {
  const subPositions = player.subPositions.filter(
    (position) => position !== player.mainPosition,
  );

  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-md border border-primary/35 bg-background px-2 py-1 text-xs font-semibold text-primary">
        <span className="text-[10px] font-bold text-muted">주</span>
        {player.mainPosition}
      </span>
      {subPositions.length > 0 ? (
        subPositions.map((position) => (
          <span
            key={position}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted"
          >
            <span className="text-[10px] font-bold text-muted">부</span>
            {position}
          </span>
        ))
      ) : (
        <span className="rounded-md border border-dashed border-border px-2 py-1 text-xs font-medium text-muted">
          부 포지션 없음
        </span>
      )}
    </span>
  );
}
