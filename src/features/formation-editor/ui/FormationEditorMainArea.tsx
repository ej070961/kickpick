import type { RefObject } from "react";
import type {
  EditorPlayer,
  EditorQuarter,
  EditorSlot,
} from "@/features/formation-editor/model/types";
import { FormationField } from "./FormationField";
import { QuarterTabs } from "./QuarterTabs";

type Props = {
  activeQuarter: EditorQuarter;
  editedQuarters: EditorQuarter[];
  exportRef: RefObject<HTMLDivElement | null>;
  onClearSelection: () => void;
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
  onClearSelection,
  onQuarterChange,
  onSlotClick,
  playerMap,
  selectedSlotId,
}: Props) {
  return (
    <div>
      <QuarterTabs
        activeQuarterNumber={activeQuarter.quarterNumber}
        quarters={editedQuarters}
        onQuarterChange={(quarterNumber) => {
          onQuarterChange(quarterNumber);
          onClearSelection();
        }}
      />

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
