import Link from "next/link";
import { CalendarDays, ListChecks, Users } from "lucide-react";
import { PageHeader } from "@/shared/ui";

const cards = [
  {
    title: "선수 관리",
    description: "주/부 포지션과 우선순위를 관리합니다.",
    href: "/players",
    icon: Users,
  },
  {
    title: "경기 목록",
    description: "저장된 경기와 포메이션 히스토리를 확인합니다.",
    href: "/matches",
    icon: ListChecks,
  },
  {
    title: "새 경기 생성",
    description: "참가자, 쿼터 수, 포메이션을 선택합니다.",
    href: "/matches/new",
    icon: CalendarDays,
  },
];

/**
 * 대시보드의 주요 작업 진입 카드를 렌더링합니다.
 */
export function DashboardPage() {
  return (
    <section>
      <PageHeader
        title="대시보드"
        description="KickPick MVP의 핵심 플로우를 빠르게 확인하고 다음 작업으로 이동합니다."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-white bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-mint-surface text-primary">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-foreground">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
