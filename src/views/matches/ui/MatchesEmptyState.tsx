import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { EmptyStatePanel } from "@/shared/ui";

/**
 * 저장된 경기가 없을 때 경기 목록 대신 보여주는 빈 상태입니다.
 */
export function MatchesEmptyState() {
  return (
    <EmptyStatePanel
      icon={<CalendarDays size={22} />}
      title="아직 만든 경기가 없어요"
      description="첫 경기를 만들고 쿼터별 라인업을 준비해보세요."
      action={
        <Link
          href="/matches/new"
          className="bg-foreground inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white transition hover:brightness-110"
        >
          경기 만들기
        </Link>
      }
    />
  );
}
