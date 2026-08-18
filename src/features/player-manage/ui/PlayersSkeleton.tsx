import { PlusCircle } from "lucide-react";
import { Button, PageHeader } from "@/shared/ui";

/**
 * 선수 관리 화면의 route loading 상태입니다.
 */
export function PlayersSkeleton() {
  return (
    <section aria-label="선수 명단 불러오는 중">
      <PageHeader
        title="선수 관리"
        description="경기 배치에 사용할 선수 정보와 순서를 정리하세요."
      />

      <div className="-mt-4 mb-4 flex justify-end">
        <Button disabled leftIcon={<PlusCircle size={18} aria-hidden="true" />}>
          선수 추가
        </Button>
      </div>

      <div className="space-y-4">
        <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-foreground text-base font-semibold">선수 명단</p>
            <p className="text-muted mt-1 text-sm">
              드래그로 자동 배치 우선순위를 조정합니다.
            </p>
          </div>
          <Button disabled className="w-full sm:w-auto">
            순서 저장
          </Button>
        </div>

        <ol className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <li
              key={index}
              className="border-border bg-card grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-lg border p-4 shadow-sm sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="bg-surface size-11 animate-pulse justify-self-center rounded-lg" />
              <div className="min-w-0 sm:contents">
                <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
                  <div className="min-w-0 space-y-3">
                    <div className="bg-surface h-6 w-40 max-w-[55vw] animate-pulse rounded-md" />
                    <div className="flex flex-wrap gap-2">
                      <div className="bg-surface h-8 w-16 animate-pulse rounded-md" />
                      <div className="bg-surface h-8 w-12 animate-pulse rounded-md" />
                      <div className="bg-surface h-8 w-12 animate-pulse rounded-md" />
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:hidden">
                    <div className="bg-surface size-9 animate-pulse rounded-lg" />
                    <div className="bg-surface size-9 animate-pulse rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="hidden gap-2 sm:flex">
                <div className="bg-surface size-9 animate-pulse rounded-lg sm:w-16" />
                <div className="bg-surface size-9 animate-pulse rounded-lg sm:w-16" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
