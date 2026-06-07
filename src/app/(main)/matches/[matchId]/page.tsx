import { FormationEditorPage } from "@/views/formation-editor/FormationEditorPage";

export default async function MatchDetailRoute({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  return <FormationEditorPage matchId={matchId} />;
}
