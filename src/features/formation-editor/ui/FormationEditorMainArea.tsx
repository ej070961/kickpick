import type { RefObject } from "react";
import { ArrowLeftRight } from "lucide-react";
import type {
  EditorPlayer,
  EditorQuarter,
  EditorSlot,
} from "@/features/formation-editor/model/types";
import { Button } from "@/shared/ui";
import { FormationField } from "./FormationField";
import { QuarterTabs } from "./QuarterTabs";

type Props = {
  activeQuarter: EditorQuarter;
  editedQuarters: EditorQuarter[];
  exportRef: RefObject<HTMLDivElement | null>;
  isPending: boolean;
  onClearSelection: () => void;
  onOpenQuarterSwap: () => void;
  onQuarterChange: (quarterNumber: number) => void;
  onSlotClick: (slot: EditorSlot) => void;
  playerMap: Map<string, EditorPlayer>;
  selectedSlotId: string | null;
};

/**
 * 쿼터 탭과 축구장 필드로 구성된 편집기 주 작업 영역입니다.
 */
export function FormationEditorMainArea({
  activeQuarter,
  editedQuarters,
  exportRef,
  isPending,
  onClearSelection,
  onOpenQuarterSwap,
  onQuarterChange,
  onSlotClick,
  playerMap,
  selectedSlotId,
}: Props) {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <QuarterTabs
          activeQuarterNumber={activeQuarter.quarterNumber}
          quarters={editedQuarters}
          onQuarterChange={(quarterNumber) => {
            onQuarterChange(quarterNumber);
            onClearSelection();
          }}
        />
        <Button
          aria-label="쿼터 배치 교환"
          className="size-11 shrink-0 px-0 text-gray-500"
          disabled={isPending}
          onClick={onOpenQuarterSwap}
          title="쿼터 배치 교환"
          variant="secondary"
        >
          <ArrowLeftRight aria-hidden="true" size={16} />
        </Button>
      </div>

      <FormationField
        exportRef={exportRef}
        playerMap={playerMap}
        quarter={activeQuarter}
        selectedSlotId={selectedSlotId}
        onSlotClick={onSlotClick}
      />
    </div>
  );
}
