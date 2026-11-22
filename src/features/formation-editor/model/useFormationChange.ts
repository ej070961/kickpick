"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { loadFormationTemplateOptions } from "@/features/formation-editor/actions/loadFormationTemplateOptions";
import { regenerateMatchFormation } from "@/features/formation-editor/actions/regenerateFormation";
import type {
  EditorTemplate,
  FormationRegenerationMode,
} from "@/features/formation-editor/model/types";
import { useEditorStore } from "@/features/formation-editor/model/store";

type UseFormationRegenerationInput = {
  formationLabel: string;
  matchId: string;
};

/**
 * 포메이션 변경 모달 상태와 재배정 서버 액션 호출을 관리합니다.
 */
export const useFormationChange = ({
  formationLabel,
  matchId,
}: UseFormationRegenerationInput) => {
  const router = useRouter();
  const [currentFormationLabel, setCurrentFormationLabel] =
    useState(formationLabel);
  const [isRegenerationOpen, setIsRegenerationOpen] = useState(false);
  const [templates, setTemplates] = useState<EditorTemplate[]>([]);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(
    null,
  );
  const [regenerationMode, setRegenerationMode] =
    useState<FormationRegenerationMode>("full");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isRegenerationPending, startRegenerationTransition] = useTransition();
  const [isLoadingTemplates, startTemplateLoad] = useTransition();
  const setFeedbackMessage = useEditorStore(
    (state) => state.setFeedbackMessage,
  );
  const applyRegeneratedQuarters = useEditorStore(
    (state) => state.applyRegeneratedQuarters,
  );

  const loadTemplates = () => {
    setTemplateLoadError(null);
    setTemplates([]);
    setSelectedTemplateId("");
    startTemplateLoad(async () => {
      try {
        const nextTemplates = await loadFormationTemplateOptions();
        setTemplates(nextTemplates);
        setSelectedTemplateId(
          nextTemplates.find(
            (template) => template.label === currentFormationLabel,
          )?.id ??
            nextTemplates[0]?.id ??
            "",
        );
      } catch {
        setTemplateLoadError("포메이션 목록을 불러오지 못했습니다.");
      }
    });
  };

  const openRegeneration = () => {
    setIsRegenerationOpen(true);
    loadTemplates();
  };

  /**
   * 선택한 템플릿과 재배정 모드로 서버 슬롯을 교체하고 화면 상태를 갱신합니다.
   */
  const submitRegeneration = () => {
    if (!selectedTemplateId) {
      setFeedbackMessage("변경할 포메이션을 선택해주세요.");
      return;
    }

    startRegenerationTransition(async () => {
      const result = await regenerateMatchFormation(matchId, {
        mode: regenerationMode,
        templateId: selectedTemplateId,
      });

      setFeedbackMessage(result.message);

      if (!result.success || !result.quarters || !result.formationLabel) {
        return;
      }

      setCurrentFormationLabel(result.formationLabel);
      setIsRegenerationOpen(false);
      applyRegeneratedQuarters(result.quarters);
      router.refresh();
    });
  };

  return {
    currentFormationLabel,
    isRegenerationOpen,
    isLoadingTemplates,
    isRegenerationPending,
    loadTemplateError: templateLoadError,
    loadTemplates,
    regenerationMode,
    selectedTemplateId,
    templates,
    setIsRegenerationOpen,
    setRegenerationMode,
    setSelectedTemplateId,
    openRegeneration,
    submitRegeneration,
  };
};
