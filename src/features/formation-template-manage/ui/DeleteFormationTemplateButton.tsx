"use client";

import type { FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { deleteFormationTemplate } from "@/features/formation-template-manage/actions/formationTemplateActions";

type DeleteFormationTemplateButtonProps = {
  templateId: string;
  templateName: string;
};

export function DeleteFormationTemplateButton({
  templateId,
  templateName,
}: DeleteFormationTemplateButtonProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`${templateName} 템플릿을 삭제할까요?`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteFormationTemplate} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={templateId} />
      <button
        type="submit"
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted transition hover:border-mismatch hover:text-mismatch"
        aria-label="템플릿 삭제"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </form>
  );
}
