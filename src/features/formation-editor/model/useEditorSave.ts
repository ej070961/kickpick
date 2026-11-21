"use client";

import { useState } from "react";
import { saveFormationSlots } from "@/features/formation-editor/actions/formationEditorActions";
import { toQuarterList } from "@/features/formation-editor/lib/formationEditorQuarters";
import { useFormationEditorStore } from "@/features/formation-editor/model/formationEditorStore";

type UseEditorSaveInput = {
  matchId: string;
};

/**
 * 편집된 슬롯 배정을 서버에 저장하는 action 흐름을 관리합니다.
 */
export function useEditorSave({ matchId }: UseEditorSaveInput) {
  const [isPending, setIsPending] = useState(false);
  const quartersByNumber = useFormationEditorStore(
    (state) => state.quartersByNumber,
  );

  async function submit(): Promise<string | null> {
    if (isPending) return null;

    const slots = toQuarterList(quartersByNumber).flatMap((quarter) =>
      quarter.slots.map((slot) => ({
        fitScore: slot.fitScore,
        id: slot.id,
        isManual: slot.isManual,
        playerId: slot.playerId,
      })),
    );

    setIsPending(true);

    try {
      const result = await saveFormationSlots(matchId, slots);

      return result.message;
    } catch {
      return "저장 중 오류가 발생했어요. 다시 시도해주세요.";
    } finally {
      setIsPending(false);
    }
  }

  return {
    isPending,
    submit,
  };
}
