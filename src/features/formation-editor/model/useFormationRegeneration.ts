"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { regenerateMatchFormation } from "@/features/formation-editor/actions/formationEditorActions";
import type {
  EditorQuarter,
  FormationEditorTemplate,
  FormationRegenerationMode,
} from "@/features/formation-editor/model/types";

type UseFormationRegenerationInput = {
  formationLabel: string;
  formationTemplates: FormationEditorTemplate[];
  matchId: string;
  onMessage: (message: string) => void;
  onRegenerated: (input: {
    formationLabel: string;
    quarters: EditorQuarter[];
  }) => void;
};

/**
 * 포메이션 변경 모달 상태와 재배정 서버 액션 호출을 관리합니다.
 */
export function useFormationRegeneration({
  formationLabel,
  formationTemplates,
  matchId,
  onMessage,
  onRegenerated,
}: UseFormationRegenerationInput) {
  const router = useRouter();
  const [currentFormationLabel, setCurrentFormationLabel] =
    useState(formationLabel);
  const [isRegenerationOpen, setIsRegenerationOpen] = useState(false);
  const [regenerationMode, setRegenerationMode] =
    useState<FormationRegenerationMode>("full");
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    formationTemplates.find((template) => template.label === formationLabel)?.id ??
      formationTemplates[0]?.id ??
      "",
  );
  const [isRegenerationPending, startRegenerationTransition] = useTransition();

  /**
   * 선택한 템플릿과 재배정 모드로 서버 슬롯을 교체하고 화면 상태를 갱신합니다.
   */
  function submitRegeneration() {
    if (!selectedTemplateId) {
      onMessage("변경할 포메이션을 선택해주세요.");
      return;
    }

    startRegenerationTransition(async () => {
      const result = await regenerateMatchFormation(matchId, {
        mode: regenerationMode,
        templateId: selectedTemplateId,
      });

      onMessage(result.message);

      if (!result.success || !result.quarters || !result.formationLabel) {
        return;
      }

      setCurrentFormationLabel(result.formationLabel);
      setIsRegenerationOpen(false);
      onRegenerated({
        formationLabel: result.formationLabel,
        quarters: result.quarters,
      });
      router.refresh();
    });
  }

  return {
    currentFormationLabel,
    isRegenerationOpen,
    isRegenerationPending,
    regenerationMode,
    selectedTemplateId,
    setIsRegenerationOpen,
    setRegenerationMode,
    setSelectedTemplateId,
    submitRegeneration,
  };
}
