"use client";

import type { FormationTemplate } from "@/entities/formation";
import { updateFormationTemplate } from "@/features/formation-template-manage/actions/formationTemplateActions";
import { Dialog } from "@/shared/ui";
import { TemplateForm } from "./TemplateForm";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  template: FormationTemplate;
};

/**
 * 기존 포메이션 템플릿의 이름과 슬롯 구성을 수정하는 모달입니다.
 */
export function EditDialog({ isOpen, onClose, template }: Props) {
  return (
    <Dialog
      description="수정한 내용은 다음 경기부터 적용됩니다."
      isOpen={isOpen}
      onClose={onClose}
      title="포메이션 수정"
    >
      <TemplateForm
        action={updateFormationTemplate}
        onSuccess={onClose}
        showHeader={false}
        template={template}
        variant="plain"
      />
    </Dialog>
  );
}
