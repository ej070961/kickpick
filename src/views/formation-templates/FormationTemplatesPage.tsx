import { GalleryVerticalEnd } from "lucide-react";
import { createFormationTemplate } from "@/features/formation-template-manage/actions/formationTemplateActions";
import { getFormationTemplates } from "@/features/formation-template-manage/lib/formationTemplateQueries";
import { DeleteFormationTemplateButton } from "@/features/formation-template-manage/ui/DeleteFormationTemplateButton";
import { FormationTemplateForm } from "@/features/formation-template-manage/ui/FormationTemplateForm";
import { PageHeader } from "@/shared/ui";

export async function FormationTemplatesPage() {
  const templates = await getFormationTemplates();

  return (
    <section>
      <PageHeader
        title="포메이션 템플릿"
        description="GK를 포함한 11개 포메이션 슬롯 템플릿을 관리합니다."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-3">
          {templates.map((template) => (
            <article
              key={template.id}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-mint-surface text-primary">
                      <GalleryVerticalEnd size={17} aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-bold text-foreground">
                      {template.label}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {template.slots.length}개 슬롯
                  </p>
                </div>
                <DeleteFormationTemplateButton
                  templateId={template.id}
                  templateName={template.label}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {template.slots.map((slot) => (
                  <span
                    key={slot.name}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold text-muted"
                  >
                    {slot.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <FormationTemplateForm action={createFormationTemplate} />
      </div>
    </section>
  );
}
