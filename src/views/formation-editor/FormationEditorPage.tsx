import { getEditorInitialData } from "@/views/formation-editor/getEditorInitialData";
import { FormationEditor } from "@/features/formation-editor/ui/FormationEditor";
import { PageHeader, PageLayout } from "@/shared/ui";

type Props = {
  matchId: string;
};

export const FormationEditorPage = async ({ matchId }: Props) => {
  const data = await getEditorInitialData(matchId);

  return (
    <PageLayout>
      <PageHeader
        title={data.match.name}
        description={`${data.match.formationLabel} / ${data.match.quarterCount}쿼터 자동 배치 초안입니다.`}
      />
      <FormationEditor
        match={{
          exportFileBaseName: data.match.exportFileBaseName,
          formationLabel: data.match.formationLabel,
          id: data.match.id,
        }}
        players={data.players}
        quarters={data.quarters}
      />
    </PageLayout>
  );
};
