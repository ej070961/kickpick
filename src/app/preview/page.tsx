import { FormationPreview } from "@/views/landing/FormationPreview";
import { PageHeader, PageLayout } from "@/shared/ui";

/** 실제 경기 상세 화면의 편집기 구성을 예시 데이터로 확인합니다. */
export default function PreviewRoute() {
  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="w-full min-w-0">
          <PageLayout>
            <PageHeader
              title="토요일 친선 경기"
              description="4-3-3 / 4쿼터 자동 배치 초안입니다."
            />
            <FormationPreview />
          </PageLayout>
        </div>
      </div>
    </main>
  );
}
