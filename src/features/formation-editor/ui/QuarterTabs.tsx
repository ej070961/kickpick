import type { EditorQuarter } from "@/features/formation-editor/model/types";

type QuarterTabsProps = {
  activeQuarterNumber: number;
  onQuarterChange: (quarterNumber: number) => void;
  quarters: EditorQuarter[];
};

/**
 * 편집할 쿼터를 전환하는 탭 목록입니다.
 */
export function QuarterTabs({
  activeQuarterNumber,
  onQuarterChange,
  quarters,
}: QuarterTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {quarters.map((quarter) => (
        <button
          key={quarter.quarterNumber}
          type="button"
          onClick={() => onQuarterChange(quarter.quarterNumber)}
          className={`min-h-10 rounded-lg border px-3 text-sm font-semibold ${
            quarter.quarterNumber === activeQuarterNumber
              ? "border-primary bg-mint-surface text-primary"
              : "border-border bg-card text-muted"
          }`}
        >
          {quarter.quarterNumber}Q
        </button>
      ))}
    </div>
  );
}
