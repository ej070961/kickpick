"use client";

import { useState } from "react";
import { saveFormationSlots } from "@/features/formation-editor/actions/saveFormation";
import { toQuarterList } from "@/features/formation-editor/lib/quarterDraft";
import { useEditorStore } from "@/features/formation-editor/model/store";

type UseEditorSaveInput = {
  matchId: string;
};

/**
 * 편집된 슬롯 배정을 서버에 저장하는 action 흐름을 관리합니다.
 */
export const useSaveFormation = ({ matchId }: UseEditorSaveInput) => {
  const [isPending, setIsPending] = useState(false);
  const quartersByNumber = useEditorStore((state) => state.quartersByNumber);
  const playersById = useEditorStore((state) => state.playersById);

  const submit = async (): Promise<string | null> => {
    if (isPending) return null;

    const slots = toQuarterList(quartersByNumber).flatMap((quarter) =>
      quarter.slots.map((slot) => ({
        fitScore: slot.fitScore,
        id: slot.id,
        isManual: slot.isManual,
        playerId: slot.playerId,
        playerType: slot.playerId
          ? (playersById[slot.playerId]?.type ?? null)
          : null,
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
  };

  return {
    isPending,
    submit,
  };
};
