import Image from "next/image";
import { useMemo } from "react";
import { useEditorStore } from "@/features/formation-editor/model/store";
import { toQuarterList } from "@/features/formation-editor/lib/quarterDraft";
import { FormationSlotButton } from "./FormationSlotButton";

type Props = {
  registerQuarterElement: (
    quarterNumber: number,
    element: HTMLDivElement | null,
  ) => void;
};

/** 전체 쿼터 내보내기에서 캡처할 필드를 화면 밖에 렌더링합니다. */
export const ExportFields = ({ registerQuarterElement }: Props) => {
  const playersById = useEditorStore((state) => state.playersById);
  const quartersByNumber = useEditorStore((state) => state.quartersByNumber);
  const quarters = useMemo(
    () => toQuarterList(quartersByNumber),
    [quartersByNumber],
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
          <div className="mx-auto max-w-md">
            <div className="relative overflow-hidden rounded-md">
              <Image
                src="/images/football-field.jpg"
                alt="축구장"
                width={626}
                height={913}
                className="h-auto w-full"
                priority
              />
              <div
                className="pointer-events-none absolute top-3 left-3 z-20 flex items-end gap-1 rounded-md bg-black/70 px-3 py-2 text-white shadow-sm"
                aria-hidden="true"
              >
                <span className="text-2xl leading-none font-black">
                  {quarter.quarterNumber}Q
                </span>
              </div>
              {quarter.slots.map((slot) => (
                <FormationSlotButton
                  key={slot.id}
                  isSelected={false}
                  player={
                    slot.playerId ? playersById[slot.playerId] : undefined
                  }
                  slot={slot}
                  onClick={() => undefined}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
