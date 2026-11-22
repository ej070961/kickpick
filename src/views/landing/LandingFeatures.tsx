import {
  AssignmentSummaryMockup,
  FormationEditorMockup,
} from "./LandingFeatureMockups";

/** 자동 배치와 직접 편집을 선명한 UI 목업으로 설명합니다. */
export function LandingFeatures() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-primary text-sm font-semibold">
          KickPick의 핵심 기능
        </p>
        <h2 className="text-foreground mt-3 text-3xl font-bold tracking-normal sm:text-4xl">
          자동 배치로 시작하고, 편집기로 완성해요
        </h2>
        <p className="text-muted mt-4 text-base leading-7">
          참가 선수에 맞춘 쿼터별 초안을 만든 뒤, 팀 운영 방식에 맞게 필요한
          부분만 조정할 수 있어요.
        </p>
      </div>

      <article className="border-border bg-card mt-12 overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-8">
        <div>
          <p className="text-primary text-sm font-semibold">
            01 · 쿼터별 자동 배치
          </p>
          <h3 className="text-foreground mt-3 text-2xl font-bold sm:text-3xl">
            선수별 출전 횟수와 포지션을 함께 고려해요
          </h3>
          <p className="text-muted mt-3 leading-7">
            참가 선수와 쿼터 수를 바탕으로 출전 횟수를 나누고, 주·부 포지션과
            팀의 배치 우선순위를 반영해 라인업 초안을 구성합니다.
          </p>
        </div>
        <div className="mt-7">
          <AssignmentSummaryMockup />
        </div>
      </article>

      <article className="border-border bg-card mt-6 overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-8">
        <div>
          <p className="text-primary text-sm font-semibold">
            02 · 편집하고 바로 공유
          </p>
          <h3 className="text-foreground mt-3 text-2xl font-bold sm:text-3xl">
            원하는 자리만 바꾸고, 팀원에게 바로 공유해요
          </h3>
          <p className="text-muted mt-3 leading-7">
            경기장 위에서 쿼터별 배치를 확인하고 선수를 교체해요. 완성한
            배치표는 현재 쿼터만 복사하거나 전체 쿼터를 한 번에 받아 팀원에게
            전할 수 있어요.
          </p>
        </div>
        <div className="mt-7">
          <FormationEditorMockup />
        </div>
      </article>
    </section>
  );
}
