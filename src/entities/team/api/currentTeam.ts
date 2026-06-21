import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/api/supabase/server";

const DEFAULT_TEAM_NAME = "KickPick 팀";

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return user.id;
}

/**
 * 현재 로그인 사용자의 팀 id를 조회합니다. 현재 제품에서는 소유자의 첫 번째 팀을 current team으로 간주합니다.
 */
export async function requireCurrentTeamId() {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data: team, error } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !team) {
    throw new Error(error?.message ?? "팀을 찾을 수 없습니다.");
  }

  return team.id as string;
}

/**
 * 현재 로그인 사용자의 팀 id를 보장합니다. 팀이 없으면 기본 팀 workspace를 생성합니다.
 */
export async function ensureCurrentTeamId() {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data: team, error } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (team) return team.id as string;

  const { data: createdTeam, error: createError } = await supabase
    .from("teams")
    .insert({ name: DEFAULT_TEAM_NAME, owner_user_id: userId })
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return createdTeam.id as string;
}
