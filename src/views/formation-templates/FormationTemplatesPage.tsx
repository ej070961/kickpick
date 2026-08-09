import { createFormationTemplate } from "@/features/formation-template-manage/actions/formationTemplateActions";
import { getFormationTemplates } from "@/features/formation-template-manage/lib/formationTemplateQueries";
import { AddDialog } from "@/features/formation-template-manage/ui/AddDialog";
import { TemplateList } from "@/features/formation-template-manage/ui/TemplateList";
import { TemplateForm } from "@/features/formation-template-manage/ui/TemplateForm";
import { PageHeader } from "@/shared/ui";

export async function FormationTemplatesPage() {
  const templates = await getFormationTemplates();

  return (
    <section>
      <PageHeader
        title="포메이션"
        description="자주 쓰는 배치를 저장해두면 경기 만들기가 빨라져요."
      />

      <div className="-mt-4 mb-4 flex justify-end xl:hidden">
        <AddDialog />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-3">
          <TemplateList templates={templates} />
        </div>

        <div className="hidden xl:block">
          <TemplateForm action={createFormationTemplate} />
        </div>
      </div>
    </section>
  );
}
