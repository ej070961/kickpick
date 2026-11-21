import { useMemo, type RefObject } from "react";
import { useFormationEditorStore } from "@/features/formation-editor/model/formationEditorStore";
import { FormationField } from "./FormationField";
import { QuarterAssignmentsPanel } from "./QuarterAssignmentsPanel";

type Props = {
  exportRef: RefObject<HTMLDivElement | null>;
  isPending: boolean;
};

/** 쿼터 순서 카드, 축구장 필드로 구성된 편집기 주 작업 영역입니다. */
export function FormationEditorMainArea({ exportRef, isPending }: Props) {
  const players = useFormationEditorStore((state) => state.players);
  const quartersByNumber = useFormationEditorStore(
    (state) => state.quartersByNumber,
  );
  const selectedQuarter = useFormationEditorStore(
    (state) => state.selectedQuarter,
  );
  const selectedSlotId = useFormationEditorStore((state) =>
    state.selection?.type === "slot" ? state.selection.slotId : null,
  );
  const handleSlotClick = useFormationEditorStore(
    (state) => state.handleSlotClick,
  );
  const activeQuarter = useMemo(() => {
    const quarter = quartersByNumber[selectedQuarter];
    return quarter
      ? { quarterNumber: selectedQuarter, slots: quarter.slots }
      : null;
  }, [quartersByNumber, selectedQuarter]);
  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  if (!activeQuarter) return null;

  return (
    <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
      <QuarterAssignmentsPanel isDisabled={isPending} />
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
