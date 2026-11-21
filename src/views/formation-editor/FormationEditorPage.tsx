import { getFormationEditorData } from "@/features/formation-editor/api/formationEditorQueries";
import { FormationEditorClient } from "@/features/formation-editor/ui/FormationEditorClient";
import { PageHeader, PageLayout } from "@/shared/ui";

type Props = {
  matchId: string;
};

export async function FormationEditorPage({ matchId }: Props) {
  const data = await getFormationEditorData(matchId);

  return (
    <PageLayout>
      <PageHeader
        title={data.match.name}
        description={`${data.match.formationLabel} / ${data.match.quarterCount}쿼터 자동 배치 초안입니다.`}
      />
      <FormationEditorClient {...data} />
    </PageLayout>
  );
}
