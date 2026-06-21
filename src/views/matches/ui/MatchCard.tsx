import Link from "next/link";
import { CalendarDays, ChevronRight, UsersRound } from "lucide-react";
import { DeleteMatchButton } from "@/features/match-delete/ui/DeleteMatchButton";
import { formatMatchDate } from "@/views/matches/lib/formatMatchDate";
import type { MatchListItem } from "@/views/matches/model/types";

type MatchCardProps = {
  match: MatchListItem;
};

/**
 * 경기 목록의 단일 카드입니다. 카드 전체는 상세 화면 링크이고 삭제 버튼만 별도 액션으로 둡니다.
 */
export function MatchCard({ match }: MatchCardProps) {
  const displayName = match.name ?? "이름 없는 경기";

  return (
    <article className="group relative rounded-2xl border border-white bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/matches/${match.id}`}
        className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="sr-only">{displayName} 포메이션 보기</span>
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-foreground">
            {displayName}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1">
              <CalendarDays size={15} aria-hidden="true" />
              {formatMatchDate(match)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1">
              <UsersRound size={15} aria-hidden="true" />
              {match.formation} / {match.quarterCount}쿼터
            </span>
          </div>
        </div>
        <ChevronRight
          size={20}
          className="mt-1 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4 text-sm">
        <div className="relative z-20 flex items-center gap-3">
          <DeleteMatchButton matchId={match.id} matchName={displayName} />
        </div>
      </div>
    </article>
  );
}
