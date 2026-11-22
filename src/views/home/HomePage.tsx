import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  GalleryVerticalEnd,
  ListChecks,
  Users,
} from "lucide-react";
import { requireCurrentTeamId } from "@/entities/team";
import { createClient } from "@/shared/api/supabase/server";
import { PageLayout } from "@/shared/ui";

const managementMenus = [
  {
    title: "경기 목록",
    description: "만든 경기와 배치표를 확인해요.",
    href: "/matches",
    icon: ListChecks,
  },
  {
    title: "선수 관리",
    description: "선수 정보와 출전 우선순위를 관리해요.",
    href: "/players",
    icon: Users,
  },
  {
    title: "포메이션 관리",
    description: "팀에서 사용할 포메이션을 관리해요.",
    href: "/formations",
    icon: GalleryVerticalEnd,
  },
];

/**
 * 로그인 후 홈입니다. 현재 팀의 선수와 예정 경기 유무에 따라 다음 준비 행동을 안내하고,
 * 자주 쓰는 관리 메뉴로 이동할 수 있게 합니다.
 */
export async function HomePage() {
  const { hasPlayers, hasUpcomingMatches } = await getHomeState();
  const hasNoPlayers = !hasPlayers;
  const primaryAction = hasNoPlayers
    ? { label: "선수 등록", href: "/players", icon: Users }
    : { label: "경기 만들기", href: "/matches/new", icon: CalendarDays };
  const PrimaryActionIcon = primaryAction.icon;

  return (
    <PageLayout>
      <section className="bg-mint-surface text-foreground relative overflow-hidden rounded-3xl border border-white/80 px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-foreground/55 text-sm font-semibold">
            KICKPICK MATCH HOME
          </p>
          <h1 className="mt-3 text-2xl leading-tight font-bold sm:text-3xl">
            {getHeroTitle({ hasNoPlayers, hasUpcomingMatches })}
          </h1>
          <p className="text-foreground/70 mt-3 max-w-xl text-sm leading-6 sm:text-base">
            {getHeroDescription({ hasNoPlayers, hasUpcomingMatches })}
          </p>
          <Link
            href={primaryAction.href}
            className="bg-foreground mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:brightness-110"
          >
            {primaryAction.label}
            <PrimaryActionIcon size={17} aria-hidden="true" />
          </Link>
        </div>
        <div
          aria-hidden="true"
          className="border-primary/10 pointer-events-none absolute -right-12 -bottom-28 size-72 rounded-full border-[36px] sm:-right-4 sm:size-96"
        />
      </section>

      <section aria-labelledby="management-menu-title">
        <div className="mb-4">
          <h2
            id="management-menu-title"
            className="text-foreground text-lg font-bold"
          >
            경기 준비 관리
          </h2>
          <p className="text-muted mt-1 text-sm">
            선수와 포메이션을 관리하고 이전 경기를 확인할 수 있어요.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {managementMenus.map((menu) => {
            const Icon = menu.icon;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className="bg-card group flex min-h-28 items-start gap-4 rounded-2xl border border-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="bg-mint-surface text-primary inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block font-bold">
                    {menu.title}
                  </span>
                  <span className="text-muted mt-1 block text-sm leading-5">
                    {menu.description}
                  </span>
                </span>
                <ArrowRight
                  size={17}
                  className="text-muted mt-1 shrink-0 transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </section>
    </PageLayout>
  );
}

async function getHomeState() {
  const teamId = await requireCurrentTeamId();
  const supabase = await createClient();
  const [playersResult, upcomingMatchesResult] = await Promise.all([
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("is_deleted", false),
    supabase
      .from("matches")
      .select("id")
      .eq("team_id", teamId)
      .gte("match_date", getTodayInKorea())
      .neq("status", "completed")
      .limit(1),
  ]);

  if (playersResult.error) {
    throw new Error(playersResult.error.message);
  }

  if (upcomingMatchesResult.error) {
    throw new Error(upcomingMatchesResult.error.message);
  }

  return {
    hasPlayers: (playersResult.count ?? 0) > 0,
    hasUpcomingMatches: (upcomingMatchesResult.data?.length ?? 0) > 0,
  };
}

function getTodayInKorea() {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());
  const parts = Object.fromEntries(
    dateParts.map(({ type, value }) => [type, value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getHeroTitle({
  hasNoPlayers,
  hasUpcomingMatches,
}: {
  hasNoPlayers: boolean;
  hasUpcomingMatches: boolean;
}) {
  if (hasNoPlayers) return "먼저 선수 명단을 준비해볼까요?";
  if (!hasUpcomingMatches) return "아직 예정된 경기가 없어요";
  return "새 경기 라인업을 만들어볼까요?";
}

function getHeroDescription({
  hasNoPlayers,
  hasUpcomingMatches,
}: {
  hasNoPlayers: boolean;
  hasUpcomingMatches: boolean;
}) {
  if (hasNoPlayers) {
    return "선수와 포지션을 등록하면 경기 참가 명단에서 바로 선택할 수 있어요.";
  }
  if (!hasUpcomingMatches) {
    return "새 경기를 만들고 참가 선수에 맞춘 쿼터별 라인업을 준비해보세요.";
  }
  return "참가 선수에 맞춰 쿼터별 라인업을 자동으로 만들고 편집할 수 있어요.";
}
