"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  rectSwappingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Toast } from "@/shared/ui";
import { useFormationEditorStore } from "@/features/formation-editor/model/formationEditorStore";
import type { EditorSlot } from "@/features/formation-editor/model/types";
import { QuarterCard } from "./QuarterCard";

type Props = {
  isDisabled: boolean;
};

type CopiedAssignment = {
  sourceLineupId: number;
  slots: EditorSlot[];
};

/** 쿼터 선택 버튼과 배치 교환·복사 카드를 구성합니다. */
export function QuarterAssignmentsPanel({ isDisabled }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const quartersByNumber = useFormationEditorStore(
    (state) => state.quartersByNumber,
  );
  const selectedQuarter = useFormationEditorStore(
    (state) => state.selectedQuarter,
  );
  const selectQuarter = useFormationEditorStore((state) => state.selectQuarter);
  const swapQuarterAssignments = useFormationEditorStore(
    (state) => state.swapQuarterAssignments,
  );
  const pasteQuarterAssignments = useFormationEditorStore(
    (state) => state.pasteQuarterAssignments,
  );
  const [copiedAssignment, setCopiedAssignment] =
    useState<CopiedAssignment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const quarters = useMemo(
    () =>
      Object.entries(quartersByNumber)
        .map(([quarterNumber, quarter]) => ({
          quarterNumber: Number(quarterNumber),
          ...quarter,
        }))
        .sort((first, second) => first.quarterNumber - second.quarterNumber),
    [quartersByNumber],
  );
  const lineupIds = quarters.map((quarter) => String(quarter.lineupId));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!copiedAssignment) return;

    function handleOutsidePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !panelRef.current?.contains(event.target)
      ) {
        setCopiedAssignment(null);
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [copiedAssignment]);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (copiedAssignment || !over || active.id === over.id) return;

    const from = active.data.current?.quarterNumber;
    const to = over.data.current?.quarterNumber;
    if (typeof from !== "number" || typeof to !== "number") return;

    const result = swapQuarterAssignments(from, to);
    if (!result.ok) {
      setToast("포지션 구성이 달라 배치를 맞바꾸지 못했어요.");
    }
  }

  function handleCopy(lineupId: number, slots: EditorSlot[]) {
    const isSameSource = copiedAssignment?.sourceLineupId === lineupId;

    setCopiedAssignment({
      sourceLineupId: lineupId,
      slots: slots.map((slot) => ({ ...slot })),
    });
    if (!isSameSource) {
      setToast("배치를 복사했어요. 붙여넣을 쿼터를 선택하세요.");
    }
  }

  function handlePaste(quarterNumber: number) {
    if (!copiedAssignment) return;

    const result = pasteQuarterAssignments(
      quarterNumber,
      copiedAssignment.slots,
    );
    setToast(
      result.ok
        ? `${quarterNumber}Q에 배치를 붙여넣었어요.`
        : "포지션 구성이 달라 붙여넣을 수 없어요.",
    );
  }

  return (
    <section
      ref={panelRef}
      aria-label="쿼터별 포메이션"
      className="border-border bg-card min-w-0 self-start rounded-xl border p-4 shadow-sm"
    >
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      <h2 className="text-foreground mb-1 text-sm font-bold">
        쿼터별 포메이션
      </h2>
      <p className="text-muted mb-3 text-xs">
        쿼터를 눌러 선택하고, 핸들을 끌어 배치를 맞바꾸세요.
      </p>
      <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-2">
        <ol className="grid content-start gap-2" aria-label="쿼터 선택">
          {quarters.map(({ quarterNumber }) => (
            <li key={quarterNumber}>
              <button
                type="button"
                disabled={isDisabled}
                aria-pressed={selectedQuarter === quarterNumber}
                aria-label={`${quarterNumber}Q 선택`}
                onClick={() => selectQuarter(quarterNumber)}
                className={`focus-visible:ring-primary flex min-h-[46px] w-full cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${selectedQuarter === quarterNumber ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background text-foreground hover:border-primary hover:bg-mint-surface"}`}
              >
                {quarterNumber}Q
              </button>
            </li>
          ))}
        </ol>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={lineupIds} strategy={rectSwappingStrategy}>
            <ol
              className="grid min-w-0 content-start gap-2"
              aria-label="쿼터 배치"
            >
              {quarters.map((quarter) => (
                <QuarterCard
                  key={quarter.lineupId}
                  canPaste={
                    copiedAssignment !== null &&
                    copiedAssignment.sourceLineupId !== quarter.lineupId
                  }
                  isCopySource={
                    copiedAssignment?.sourceLineupId === quarter.lineupId
                  }
                  isDisabled={isDisabled}
                  isDragDisabled={isDisabled || copiedAssignment !== null}
                  lineupId={quarter.lineupId}
                  quarterNumber={quarter.quarterNumber}
                  onCopy={() => handleCopy(quarter.lineupId, quarter.slots)}
                  onPaste={() => handlePaste(quarter.quarterNumber)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
