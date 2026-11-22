"use client";

import { useMemo, type RefObject } from "react";
import Image from "next/image";
import { useEditorStore } from "@/features/formation-editor/model/store";
import { FormationSlotButton } from "./FormationSlotButton";

type Props = {
  exportRef: RefObject<HTMLDivElement | null>;
  isDisabled: boolean;
};

/** 편집 중인 쿼터·선수·선택 상태를 필드 표시와 슬롯 입력에 연결합니다. */
export const QuarterLineupSection = ({ exportRef, isDisabled }: Props) => {
  const playersById = useEditorStore((state) => state.playersById);
  const quartersByNumber = useEditorStore((state) => state.quartersByNumber);
  const selectedQuarter = useEditorStore((state) => state.selectedQuarter);
  const selection = useEditorStore((state) => state.selection);
  const selectedSlotId = selection?.type === "slot" ? selection.id : null;
  const selectSlot = useEditorStore((state) => state.selectSlot);
  const activeQuarter = useMemo(() => {
    const quarter = quartersByNumber[selectedQuarter];
    return quarter
      ? { quarterNumber: selectedQuarter, slots: quarter.slots }
      : null;
  }, [quartersByNumber, selectedQuarter]);

  if (!activeQuarter) return null;

  return (
    <div className="mx-auto max-w-md">
      <div ref={exportRef} className="relative overflow-hidden rounded-md">
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
            {activeQuarter.quarterNumber}Q
          </span>
        </div>
        {activeQuarter.slots.map((slot) => (
          <FormationSlotButton
            key={slot.id}
            isSelected={selectedSlotId === slot.id}
            player={slot.playerId ? playersById[slot.playerId] : undefined}
            slot={slot}
            onClick={() => {
              if (!isDisabled) selectSlot(slot.id);
            }}
          />
        ))}
      </div>
    </div>
  );
};
