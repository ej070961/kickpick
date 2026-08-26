"use client";

import { useTransition } from "react";
import { saveFormationSlots } from "@/features/formation-editor/actions/formationEditorActions";
import type { EditorQuarter } from "@/features/formation-editor/model/types";

type UseEditorSaveInput = {
  editedQuarters: EditorQuarter[];
  matchId: string;
  onMessage: (message: string) => void;
  onSaved: () => void;
};

/**
 * 편집된 슬롯 배정을 서버에 저장하는 action 흐름을 관리합니다.
 */
export function useEditorSave({
  editedQuarters,
  matchId,
  onMessage,
  onSaved,
}: UseEditorSaveInput) {
  const [isPending, startTransition] = useTransition();

  function submit() {
    const slots = editedQuarters.flatMap((quarter) =>
      quarter.slots.map((slot) => ({
        fitScore: slot.fitScore,
        id: slot.id,
        isManual: slot.isManual,
        playerId: slot.playerId,
      })),
    );

    startTransition(async () => {
      const result = await saveFormationSlots(matchId, slots);
      onMessage(result.message);

      if (result.success) {
        onSaved();
      }
    });
  }

  return {
    isPending,
    submit,
  };
}
