const STEP_ITEMS = [
  { label: "경기 설정", value: 1 },
  { label: "쿼터 배정", value: 2 },
];

/**
 * 경기 생성 wizard의 현재 단계를 시각적으로 표시합니다.
 */
export function StepIndicator({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1">
      {STEP_ITEMS.map((item) => {
        const active = step === item.value;

        return (
          <div
            key={item.value}
            className={`rounded-xl px-4 py-3 text-center text-sm font-bold transition ${
              active ? "bg-card text-foreground shadow-sm" : "text-muted"
            }`}
          >
            <span className="mr-2 text-primary">{item.value}</span>
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
