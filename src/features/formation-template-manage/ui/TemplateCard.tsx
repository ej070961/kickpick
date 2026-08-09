"use client";

import { useState } from "react";
import { GalleryVerticalEnd, Pencil } from "lucide-react";
import type { FormationTemplate } from "@/entities/formation";
import { Button } from "@/shared/ui";
import { DeleteFormationTemplateButton } from "./DeleteFormationTemplateButton";
import { EditDialog } from "./EditDialog";

type Props = {
  template: FormationTemplate;
};

/**
 * 포메이션 템플릿 요약과 수정/삭제 액션을 제공하는 목록 카드입니다.
 */
export function TemplateCard({ template }: Props) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <article className="border-border bg-card rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-mint-surface text-primary inline-flex size-9 items-center justify-center rounded-lg">
            <GalleryVerticalEnd size={17} aria-hidden="true" />
          </span>
          <h3 className="text-foreground text-base font-bold">
            {template.label}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            aria-label={`${template.label} 템플릿 수정`}
            className="size-9 px-0"
            onClick={() => setIsEditOpen(true)}
            size="sm"
            variant="secondary"
          >
            <Pencil size={16} aria-hidden="true" />
          </Button>
          <DeleteFormationTemplateButton
            templateId={template.id}
            templateName={template.label}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {template.slots.map((slot) => (
          <span
            key={slot.name}
            className="border-border bg-background text-muted rounded-md border px-2 py-1 text-xs font-semibold"
          >
            {slot.name}
          </span>
        ))}
      </div>
      <EditDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        template={template}
      />
    </article>
  );
}
