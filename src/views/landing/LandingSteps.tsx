const steps = [
  {
    number: "01",
    title: "선수와 포지션 등록",
    description: "등번호, 주·부 포지션, 팀 배치 우선순위를 정리해요.",
  },
  {
    number: "02",
    title: "경기와 참가자 설정",
    description: "경기 쿼터와 포메이션을 고르고 참가 명단을 정해요.",
  },
  {
    number: "03",
    title: "자동 배치 후 직접 편집",
    description: "쿼터별 초안을 확인하고 필요한 부분을 바꿔 팀에 공유해요.",
  },
];

/** 선수 명단에서 자동 배치와 편집, 공유까지의 흐름을 설명합니다. */
export function LandingSteps() {
  return (
    <section className="bg-white/70 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-primary text-sm font-semibold">이용 순서</p>
          <h2 className="text-foreground mt-3 text-3xl font-bold tracking-normal sm:text-4xl">
            선수 정보부터 쿼터별 배치까지
          </h2>
        </div>
        <div className="mt-10 grid auto-rows-fr gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="border-border bg-card flex h-full flex-col rounded-lg border p-5 shadow-sm"
            >
              <span className="text-primary text-sm font-semibold">
                {step.number}
              </span>
              <h3 className="text-foreground mt-3 text-base font-semibold">
                {step.title}
              </h3>
              <p className="text-muted mt-2 min-h-12 text-sm leading-6">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
