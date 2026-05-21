import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  PlusCircle,
  UsersRound,
} from "lucide-react";
import type { MatchStatus } from "@/entities/match";
import { DeleteMatchButton } from "@/features/match-delete/ui/DeleteMatchButton";
import { createClient } from "@/shared/api/supabase/server";
import { PageHeader } from "@/shared/ui";

type MatchRow = {
  created_at: string;
  formation: string;
  id: string;
  match_date: string | null;
  name: string | null;
  quarter_count: number;
  status: MatchStatus;
};

async function getCurrentTeamId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: team, error } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !team) {
    throw new Error(error?.message ?? "팀을 찾을 수 없습니다.");
  }

  return team.id as string;
}

async function getMatches() {
  const supabase = await createClient();
  const teamId = await getCurrentTeamId();
  const { data, error } = await supabase
    .from("matches")
    .select("id, name, match_date, quarter_count, formation, status, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MatchRow[];
}

function formatMatchDate(match: MatchRow) {
  if (match.match_date) return match.match_date;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(match.created_at));
}

const statusLabel: Record<MatchStatus, string> = {
  completed: "완료",
  draft: "초안",
  generated: "생성됨",
};

export default async function MatchesRoute() {
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
          {matches.map((match) => {
            const displayName = match.name ?? "이름 없는 경기";

            return (
              <article
                key={match.id}
                className="rounded-2xl border border-white bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Link href={`/matches/${match.id}`} className="group block">
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
                          {match.formation} / {match.quarter_count}쿼터
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={20}
                      className="mt-1 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
                  <span className="font-semibold text-primary">
                    {statusLabel[match.status]}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/matches/${match.id}`}
                      className="font-semibold text-muted transition hover:text-foreground"
                    >
                      포메이션 보기
                    </Link>
                    <DeleteMatchButton
                      matchId={match.id}
                      matchName={displayName}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
          <p className="text-lg font-bold text-foreground">
            아직 저장된 경기가 없습니다.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            새 경기를 생성하면 이곳에서 다시 열어볼 수 있습니다.
          </p>
        </div>
      )}
    </section>
  );
}
