"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createFormationTemplate } from "@/features/formation-template-manage/actions/formationTemplateActions";
import { Button, Dialog } from "@/shared/ui";
import { TemplateForm } from "./TemplateForm";

export function AddDialog() {
  const [isOpen, setIsOpen] = useState(false);

  function closeDialog() {
    setIsOpen(false);
  }

  return (
    <>
      <Button
        aria-label="새 포메이션 추가"
        leftIcon={<Plus size={18} aria-hidden="true" />}
        onClick={() => setIsOpen(true)}
      >
        새 포메이션
      </Button>
      <Dialog
        description="포메이션 이름과 포지션을 선택하세요."
        isOpen={isOpen}
        onClose={closeDialog}
        title="⚽ 새 포메이션"
      >
        <TemplateForm
          action={createFormationTemplate}
          onSuccess={closeDialog}
          showHeader={false}
          variant="plain"
        />
      </Dialog>
    </>
  );
}
