import { PageHeader } from "@/shared/ui";

/**
 * 포메이션 템플릿 관리 화면의 route loading 상태입니다.
 */
export function Skeleton() {
  return (
    <section>
      <PageHeader
        title="포메이션"
        description="자주 쓰는 배치를 저장해두면 경기 만들기가 빨라져요."
      />

      <div className="mb-4 flex justify-end xl:hidden">
        <div className="bg-surface h-11 w-32 animate-pulse rounded-lg" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="border-border bg-card rounded-lg border p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-surface size-9 animate-pulse rounded-lg" />
                  <div>
                    <div className="bg-surface h-5 w-24 animate-pulse rounded-md" />
                    <div className="bg-surface mt-2 h-4 w-16 animate-pulse rounded-md" />
                  </div>
                </div>
                <div className="bg-surface size-9 animate-pulse rounded-lg" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from({ length: 11 }).map((__, slotIndex) => (
                  <div
                    key={slotIndex}
                    className="bg-surface h-7 w-10 animate-pulse rounded-md"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-border bg-card hidden rounded-lg border p-4 shadow-sm xl:block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="bg-surface h-5 w-28 animate-pulse rounded-md" />
              <div className="bg-surface mt-2 h-4 w-56 animate-pulse rounded-md" />
            </div>
            <div className="bg-surface h-7 w-12 animate-pulse rounded-md" />
          </div>
          <div className="bg-surface mt-4 h-11 animate-pulse rounded-lg" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 14 }).map((_, index) => (
              <div
                key={index}
                className="bg-surface h-9 w-14 animate-pulse rounded-lg"
              />
            ))}
          </div>
          <div className="bg-surface mt-4 h-11 w-32 animate-pulse rounded-lg" />
        </div>
      </div>
    </section>
  );
}
