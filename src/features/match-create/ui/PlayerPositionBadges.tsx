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
        className="border-primary/35 bg-background text-primary inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold"
      >
        {player.mainPosition}
      </span>
      <SubPositionBadges subPositions={subPositions} />
    </span>
  );
}

function SubPositionBadges({
  subPositions,
}: {
  subPositions: Player["subPositions"];
}) {
  if (subPositions.length === 0) {
    return (
      <span className="border-border text-muted rounded-md border border-dashed px-2 py-1 text-xs font-medium">
        부 포지션 없음
      </span>
    );
  }

  return subPositions.map((position) => (
    <span
      key={position}
      aria-label={`부 포지션 ${position}`}
      className="border-border bg-background text-muted inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium"
    >
      {position}
    </span>
  ));
}
