import type { FormationTemplate } from "@/entities/formation";
import { EmptyState } from "./EmptyState";
import { TemplateCard } from "./TemplateCard";

type Props = {
  templates: FormationTemplate[];
};

/**
 * 포메이션 템플릿 목록과 빈 상태를 같은 목록 영역 안에서 전환합니다.
 */
export function TemplateList({ templates }: Props) {
  if (templates.length === 0) {
    return <EmptyState />;
  }

  return templates.map((template) => (
    <TemplateCard key={template.id} template={template} />
  ));
}
