"use client";

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
import type { ReactNode } from "react";
import type { QuarterDraftItem } from "@/features/formation-editor/model/types";

type Props = {
  quarters: QuarterDraftItem[];
  children: ReactNode;
  onSwap: (sourceQuarterNumber: number, targetQuarterNumber: number) => void;
};

/** 쿼터 카드의 정렬 context와 드래그 후 교환을 관리합니다. */
export const QuarterFormationDragArea = ({
  quarters,
  children,
  onSwap,
}: Props) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const sortableIds = quarters.map((quarter) => String(quarter.lineupId));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const source = active.data.current?.quarterNumber;
    const target = over.data.current?.quarterNumber;
    if (typeof source !== "number" || typeof target !== "number") {
      return;
    }

    onSwap(source, target);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableIds} strategy={rectSwappingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
};
