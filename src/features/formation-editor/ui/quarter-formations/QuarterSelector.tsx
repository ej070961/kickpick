"use client";

import { useEditorStore } from "@/features/formation-editor/model/store";

type Props = {
  isDisabled: boolean;
};

/** 편집할 쿼터를 선택하는 버튼 목록입니다. */
export const QuarterSelector = ({ isDisabled }: Props) => {
  const quartersByNumber = useEditorStore((state) => state.quartersByNumber);
  const selectedQuarter = useEditorStore((state) => state.selectedQuarter);
  const selectQuarter = useEditorStore((state) => state.selectQuarter);

  const quarterCount = Object.keys(quartersByNumber).length;
  const quarterNumbers = Array.from(
    { length: quarterCount },
    (_, index) => index + 1,
  );

  return (
    <ol className="grid content-start gap-2" aria-label="쿼터 선택">
      {quarterNumbers.map((quarterNumber) => (
        <li key={quarterNumber}>
          <button
            type="button"
            disabled={isDisabled}
            aria-pressed={selectedQuarter === quarterNumber}
            aria-label={`${quarterNumber}Q 선택`}
            onClick={() => selectQuarter(quarterNumber)}
            className={`focus-visible:ring-primary flex min-h-[46px] w-full cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${selectedQuarter === quarterNumber ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background text-foreground hover:border-primary hover:bg-mint-surface"}`}
          >
            {quarterNumber}Q
          </button>
        </li>
      ))}
    </ol>
  );
};
