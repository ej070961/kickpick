"use client";

import { QuarterFormationList } from "./QuarterFormationList";
import { QuarterSelector } from "./QuarterSelector";

type Props = {
  isDisabled: boolean;
};

/** 쿼터 선택과 쿼터별 배치 교환·복사 영역을 조립합니다. */
export const QuarterFormationsSection = ({ isDisabled }: Props) => {
  return (
    <section
      aria-label="쿼터별 포메이션"
      className="border-border bg-card min-w-0 self-start rounded-xl border p-4 shadow-sm"
    >
      <h2 className="text-foreground mb-1 text-sm font-bold">
        쿼터별 포메이션
      </h2>
      <p className="text-muted mb-3 text-xs">
        쿼터를 눌러 선택하고, 핸들을 끌어 배치를 맞바꾸세요.
      </p>
      <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-2">
        <QuarterSelector isDisabled={isDisabled} />
        <QuarterFormationList isDisabled={isDisabled} />
      </div>
    </section>
  );
};
