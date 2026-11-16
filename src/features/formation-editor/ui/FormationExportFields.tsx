import { useMemo } from "react";
import { useFormationEditorStore } from "@/features/formation-editor/model/formationEditorStore";
import { FormationField } from "./FormationField";

type Props = {
  registerQuarterElement: (
    quarterNumber: number,
    element: HTMLDivElement | null,
  ) => void;
};

/** 전체 쿼터 내보내기에서 캡처할 필드를 화면 밖에 렌더링합니다. */
export function FormationExportFields({ registerQuarterElement }: Props) {
  const players = useFormationEditorStore((state) => state.players);
  const quarters = useFormationEditorStore((state) => state.quarters);
  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 -left-[10000px] w-[400px]"
    >
      {quarters.map((quarter) => (
        <div
          key={quarter.quarterNumber}
          ref={(element) =>
            registerQuarterElement(quarter.quarterNumber, element)
          }
          className="w-full"
        >
          <FormationField
            exportRef={{ current: null }}
            playerMap={playerMap}
            quarter={quarter}
            selectedSlotId={null}
            onSlotClick={() => undefined}
          />
        </div>
      ))}
    </div>
  );
}
