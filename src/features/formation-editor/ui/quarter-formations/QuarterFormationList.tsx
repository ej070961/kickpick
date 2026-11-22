"use client";

import { useCallback, useRef, useState } from "react";
import { Toast } from "@/shared/ui";
import { toQuarterDraftList } from "@/features/formation-editor/lib/quarterDraft";
import { useEditorStore } from "@/features/formation-editor/model/store";
import { useOutsideClick } from "./useOutsideClick";
import type { QuarterDraftItem } from "@/features/formation-editor/model/types";
import { QuarterFormationCard } from "./QuarterFormationCard";
import { QuarterFormationDragArea } from "./QuarterFormationDragArea";

type Props = {
  isDisabled: boolean;
};

type QuarterCopy = {
  sourceLineupId: number;
  slots: QuarterDraftItem["slots"];
};

/** 쿼터 배치 복사·붙여넣기와 카드 목록을 관리합니다. */
export const QuarterFormationList = ({ isDisabled }: Props) => {
  const quartersByNumber = useEditorStore((state) => state.quartersByNumber);
  const pasteQuarterAssignments = useEditorStore(
    (state) => state.pasteQuarterAssignments,
  );
  const swapQuarterAssignments = useEditorStore(
    (state) => state.swapQuarterAssignments,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const [quarterCopy, setQuarterCopy] = useState<QuarterCopy | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearCopy = useCallback(() => setQuarterCopy(null), []);

  useOutsideClick(listRef, clearCopy, quarterCopy !== null);
  const quarters = toQuarterDraftList(quartersByNumber);

  const handleCopy = () => {
    setToast("배치를 복사했어요. 붙여넣을 쿼터를 선택하세요.");
  };

  const handlePaste = (
    quarterNumber: number,
    slots: QuarterDraftItem["slots"],
  ) => {
    const result = pasteQuarterAssignments(quarterNumber, slots);
    setToast(
      result.ok
        ? `${quarterNumber}Q에 배치를 붙여넣었어요.`
        : "포지션 구성이 달라 붙여넣을 수 없어요.",
    );
  };

  const handleSwap = (source: number, target: number) => {
    const result = swapQuarterAssignments(source, target);
    if (!result.ok) {
      setToast("포지션 구성이 달라 배치를 맞바꾸지 못했어요.");
    }
  };

  return (
    <>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      <div ref={listRef}>
        <QuarterFormationDragArea quarters={quarters} onSwap={handleSwap}>
          <ol
            className="grid min-w-0 content-start gap-2"
            aria-label="쿼터 배치"
          >
            {quarters.map((quarter) => (
              <QuarterFormationCard
                key={quarter.lineupId}
                canPaste={
                  quarterCopy !== null &&
                  quarterCopy.sourceLineupId !== quarter.lineupId
                }
                isCopySource={quarterCopy?.sourceLineupId === quarter.lineupId}
                isDisabled={isDisabled}
                isDragDisabled={isDisabled || quarterCopy !== null}
                lineupId={quarter.lineupId}
                quarterNumber={quarter.quarterNumber}
                onCopy={() => {
                  const isSameSource =
                    quarterCopy?.sourceLineupId === quarter.lineupId;
                  setQuarterCopy({
                    sourceLineupId: quarter.lineupId,
                    slots: quarter.slots.map((slot) => ({ ...slot })),
                  });
                  if (!isSameSource) handleCopy();
                }}
                onPaste={() =>
                  quarterCopy &&
                  handlePaste(quarter.quarterNumber, quarterCopy.slots)
                }
              />
            ))}
          </ol>
        </QuarterFormationDragArea>
      </div>
    </>
  );
};
