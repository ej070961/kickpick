import { requireCurrentTeamId } from "@/entities/team";
import { createClient } from "@/shared/api/supabase/server";
import type { MatchListItem } from "@/views/matches/model/types";

type MatchRow = {
  created_at: string;
  formation: string;
  id: string;
  match_date: string | null;
  name: string | null;
  quarter_count: number;
};

/**
 * Supabase match row를 경기 목록 화면 전용 모델로 변환합니다.
 */
function mapMatch(row: MatchRow): MatchListItem {
  return {
    createdAt: row.created_at,
    formation: row.formation,
    id: row.id,
    matchDate: row.match_date,
    name: row.name,
    quarterCount: row.quarter_count,
  };
}

/**
 * 경기 목록 화면에서 사용할 현재 팀의 경기를 최신 생성순으로 불러옵니다.
 */
export async function getMatches() {
  const supabase = await createClient();
  const teamId = await requireCurrentTeamId();
  const { data, error } = await supabase
    .from("matches")
    .select("id, name, match_date, quarter_count, formation, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapMatch(row as MatchRow));
}
