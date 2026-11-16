import type { RefObject } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/shared/ui";
import { useFormationEditorStore } from "@/features/formation-editor/model/formationEditorStore";
import { useMemo } from "react";
import { FormationField } from "./FormationField";
import { QuarterTabs } from "./QuarterTabs";

type Props = {
  exportRef: RefObject<HTMLDivElement | null>;
  isPending: boolean;
  onOpenQuarterSwap: () => void;
};

/**
 * 쿼터 탭과 축구장 필드로 구성된 편집기 주 작업 영역입니다.
 */
export function FormationEditorMainArea({
  exportRef,
  isPending,
  onOpenQuarterSwap,
}: Props) {
  const players = useFormationEditorStore((state) => state.players);
  const quarters = useFormationEditorStore((state) => state.quarters);
  const activeQuarterNumber = useFormationEditorStore(
    (state) => state.activeQuarterNumber,
  );
  const selectedSlotId = useFormationEditorStore((state) =>
    state.selection?.type === "slot" ? state.selection.slotId : null,
  );
  const selectQuarter = useFormationEditorStore((state) => state.selectQuarter);
  const handleSlotClick = useFormationEditorStore(
    (state) => state.handleSlotClick,
  );
  const activeQuarter = useMemo(
    () =>
      quarters.find(
        (quarter) => quarter.quarterNumber === activeQuarterNumber,
      ) ?? quarters[0],
    [activeQuarterNumber, quarters],
  );
  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  if (!activeQuarter) return null;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <QuarterTabs
          activeQuarterNumber={activeQuarterNumber}
          quarters={quarters}
          onQuarterChange={selectQuarter}
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
        onSlotClick={(slot) => {
          if (!isPending) handleSlotClick(slot.id);
        }}
      />
    </div>
  );
}
