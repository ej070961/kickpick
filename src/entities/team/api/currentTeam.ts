import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/api/supabase/server";

const DEFAULT_TEAM_NAME = "KickPick 팀";

type EnsureDefaultTeamOptions = {
  onCreatedTeam?: (teamId: string) => Promise<void>;
};

export async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return user.id;
}

/**
 * 특정 사용자의 기본 팀 workspace를 보장합니다.
 */
export async function ensureDefaultTeamForUser(
  ownerUserId: string,
  teamName = DEFAULT_TEAM_NAME,
  options: EnsureDefaultTeamOptions = {},
) {
  const supabase = await createClient();
  const { data: team, error } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (team) return team.id as string;

  const { data: createdTeam, error: createError } = await supabase
    .from("teams")
    .insert({ name: teamName, owner_user_id: ownerUserId })
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  const createdTeamId = createdTeam.id as string;

  try {
    await options.onCreatedTeam?.(createdTeamId);
  } catch (error) {
    await supabase.from("teams").delete().eq("id", createdTeamId);
    throw error;
  }

  return createdTeamId;
}

/**
 * 현재 로그인 사용자의 current team id를 조회합니다.
 *
 * 현재 제품은 팀 전환 UI가 없으므로 가장 먼저 생성된 팀을 current team으로 간주합니다.
 * 추후 멀티팀을 지원하면 이 함수 내부에서 선택된 팀 id와 접근 권한을 확인합니다.
 */
export async function getCurrentTeamId() {
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

  return team?.id as string | undefined;
}

/**
 * 현재 로그인 사용자의 current team id를 조회합니다.
 */
export async function requireCurrentTeamId() {
  const teamId = await getCurrentTeamId();

  if (!teamId) {
    throw new Error("팀을 찾을 수 없습니다.");
  }

  return teamId;
}

/**
 * 현재 로그인 사용자의 current team id를 보장합니다.
 */
export async function ensureCurrentTeamId() {
  const userId = await getCurrentUserId();

  return ensureDefaultTeamForUser(userId);
}
