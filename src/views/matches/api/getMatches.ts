import { redirect } from "next/navigation";
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
 * 현재 로그인 사용자가 소유한 첫 번째 팀 id를 조회하고, 비로그인 사용자는 로그인으로 보냅니다.
 */
async function getCurrentTeamId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: team, error } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !team) {
    throw new Error(error?.message ?? "팀을 찾을 수 없습니다.");
  }

  return team.id as string;
}

/**
 * 경기 목록 화면에서 사용할 현재 팀의 경기를 최신 생성순으로 불러옵니다.
 */
export async function getMatches() {
  const supabase = await createClient();
  const teamId = await getCurrentTeamId();
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
