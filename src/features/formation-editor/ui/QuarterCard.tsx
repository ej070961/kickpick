"use client";

import { arraySwap, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ClipboardPaste, Copy, GripVertical } from "lucide-react";

type Props = {
  canPaste: boolean;
  isCopySource: boolean;
  isDisabled: boolean;
  isDragDisabled: boolean;
  lineupId: number;
  quarterNumber: number;
  onCopy: () => void;
  onPaste: () => void;
};

/** 쿼터 라벨과 분리된 드래그·복사 전용 카드를 표시합니다. */
export function QuarterCard({
  canPaste,
  isCopySource,
  isDisabled,
  isDragDisabled,
  lineupId,
  quarterNumber,
  onCopy,
  onPaste,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(lineupId),
    data: { quarterNumber },
    disabled: isDragDisabled,
    getNewIndex: ({ id, items, activeIndex, overIndex }) =>
      arraySwap(items, activeIndex, overIndex).indexOf(id),
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border-border bg-background min-w-0 rounded-xl border px-2 py-1.5 ${isDragging ? "z-10 opacity-60" : ""}`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={isDragDisabled}
          aria-label={`${quarterNumber}Q 배치 드래그`}
          className="text-muted hover:bg-card focus-visible:ring-primary flex size-8 shrink-0 touch-none items-center justify-center rounded-md focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={17} aria-hidden="true" />
        </button>
        {!canPaste && (
          <button
            type="button"
            disabled={isDisabled}
            onClick={onCopy}
            aria-label={isCopySource ? "배치 다시 복사" : "배치 복사"}
            title={isCopySource ? "다시 복사" : "복사"}
            className={`ml-auto flex size-8 shrink-0 items-center justify-center rounded-md disabled:opacity-50 ${isCopySource ? "text-primary" : "text-muted hover:bg-card hover:text-primary"}`}
          >
            <Copy size={15} aria-hidden="true" />
          </button>
        )}
        {canPaste && (
          <button
            type="button"
            disabled={isDisabled}
            onClick={onPaste}
            aria-label={`${quarterNumber}Q에 배치 붙여넣기`}
            title="붙여넣기"
            className="text-primary hover:bg-card ml-auto flex size-8 shrink-0 items-center justify-center rounded-md disabled:opacity-50"
          >
            <ClipboardPaste size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  );
}
