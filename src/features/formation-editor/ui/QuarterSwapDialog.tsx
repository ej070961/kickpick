import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ArrowLeftRight } from "lucide-react";
import { ConfirmDialog } from "@/shared/ui";
import { useFormationEditorStore } from "@/features/formation-editor/model/formationEditorStore";
import { QuarterSelect } from "./QuarterSelect";

type Props = {
  errorMessage: string | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (first: number, second: number) => void;
};

/** 편집 상태에 적용할 두 쿼터의 배치 교환을 확인합니다. */
export function QuarterSwapDialog({
  errorMessage,
  isPending,
  onClose,
  onConfirm,
}: Props) {
  const [first, setFirst] = useState<number | null>(null);
  const [second, setSecond] = useState<number | null>(null);
  const [hasConfirmedSelection, setHasConfirmedSelection] = useState(false);
  const quarterNumbers = useFormationEditorStore(
    useShallow((state) =>
      state.quarters.map((quarter) => quarter.quarterNumber),
    ),
  );

  const canConfirm = first !== null && second !== null && first !== second;

  const confirmSwap = () => {
    if (!canConfirm) return;

    setHasConfirmedSelection(true);
    onConfirm(first, second);
  };

  return (
    <ConfirmDialog
      description={"교환할 두 쿼터를 선택해주세요."}
      isConfirmDisabled={!canConfirm}
      isOpen
      isPending={isPending}
      onClose={onClose}
      onConfirm={confirmSwap}
      title="쿼터 배치를 교환할까요?"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <QuarterSelect
          excludedQuarter={second}
          label="첫 번째 쿼터"
          onChange={(quarter) => {
            setFirst(quarter);
            setHasConfirmedSelection(false);
          }}
          quarterNumbers={quarterNumbers}
          value={first}
        />
        <ArrowLeftRight aria-hidden="true" className="text-muted" size={18} />
        <QuarterSelect
          excludedQuarter={first}
          label="두 번째 쿼터"
          onChange={(quarter) => {
            setSecond(quarter);
            setHasConfirmedSelection(false);
          }}
          quarterNumbers={quarterNumbers}
          value={second}
        />
      </div>
      {hasConfirmedSelection && errorMessage && (
        <p
          className="text-mismatch rounded-lg bg-orange-50 px-3 py-2 text-sm"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </ConfirmDialog>
  );
}
