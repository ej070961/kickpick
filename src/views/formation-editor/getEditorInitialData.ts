import { requireCurrentTeamId } from "@/entities/team";
import { getEditorMatchData } from "@/features/formation-editor/api/queries";
import type { EditorInitialData } from "@/features/formation-editor/model/types";

/** 편집 화면의 서버 전용 제목 정보와 클라이언트 편집 초안을 조회합니다. */
export const getEditorInitialData = async (
  matchId: string,
): Promise<EditorInitialData> => {
  const teamId = await requireCurrentTeamId();
  return getEditorMatchData({ matchId, teamId });
};
