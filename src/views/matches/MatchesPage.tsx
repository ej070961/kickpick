import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/shared/ui";
import { getMatches } from "@/views/matches/api/getMatches";
import { MatchCard } from "@/views/matches/ui/MatchCard";
import { MatchesEmptyState } from "@/views/matches/ui/MatchesEmptyState";

/**
 * 경기 목록 페이지입니다. 현재 팀의 경기를 불러와 카드 목록과 생성 진입점을 조립합니다.
 */
export async function MatchesPage() {
  const matches = await getMatches();

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="경기 목록"
          description="저장된 경기와 생성된 포메이션 히스토리를 확인합니다."
        />
        <Link
          href="/matches/new"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-95"
        >
          <PlusCircle size={18} aria-hidden="true" />
          새 경기 생성
        </Link>
      </div>

      {matches.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <MatchesEmptyState />
      )}
    </section>
  );
}
