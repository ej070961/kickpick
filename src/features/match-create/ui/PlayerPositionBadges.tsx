import type { Player } from "@/entities/player";

/**
 * 선수의 주 포지션과 부 포지션을 작은 배지 목록으로 렌더링합니다.
 */
export function PlayerPositionBadges({ player }: { player: Player }) {
  const subPositions = player.subPositions.filter(
    (position) => position !== player.mainPosition,
  );

  return (
    <span className="mt-2 flex flex-wrap gap-1.5 sm:mt-0">
      <span
        aria-label={`주 포지션 ${player.mainPosition}`}
        className="inline-flex items-center rounded-md border border-primary/35 bg-background px-2 py-1 text-xs font-semibold text-primary"
      >
        {player.mainPosition}
      </span>
      {subPositions.length > 0 ? (
        subPositions.map((position) => (
          <span
            key={position}
            aria-label={`부 포지션 ${position}`}
            className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted"
          >
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
