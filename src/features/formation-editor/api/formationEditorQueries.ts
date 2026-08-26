import { createClient } from "@/shared/api/supabase/server";
import { requireCurrentTeamId } from "@/entities/team";
import {
  toEditorPlayer,
  toEditorQuarters,
  toInsertedEditorQuarters,
  toRosterCandidate,
} from "@/features/formation-editor/lib/formationEditorMappers";
import { getFormationTemplates } from "@/features/formation-template-manage/lib/formationTemplateQueries";
import type {
  EditorPlayer,
  EditorQuarter,
  FormationEditorInitialProps,
  FormationEditorMatch,
  RosterCandidate,
} from "@/features/formation-editor/model/types";
import type {
  FormationQuarterRow,
  InsertedSlotRow,
  MatchDetailRow,
  MatchPlayerRow,
  MatchRow,
  QuarterRow,
  RosterPlayerRow,
} from "./formationEditorRows";

export type FormationEditorData = {
  /** 편집기 client에 그대로 전달할 초기 props입니다. */
  editor: FormationEditorInitialProps;
  /** 페이지 헤더와 export에서 공통으로 사용하는 경기 정보입니다. */
  match: FormationEditorMatch;
};

type RegenerationContext = {
  match: MatchRow;
  matchPlayers: MatchPlayerRow[];
  quarters: QuarterRow[];
};

/**
 * 포메이션 편집기 화면 렌더링에 필요한 초기 데이터를 조회하고 editor 타입으로 정규화합니다.
 */
export async function getFormationEditorData(
  matchId: string,
): Promise<FormationEditorData> {
  const teamId = await requireCurrentTeamId();
  const [{ match, players, quarters }, formationTemplates, rosterPlayers] =
    await Promise.all([
      getMatchFormation({ matchId, teamId }),
      getFormationTemplates(teamId),
      getRosterPlayers(teamId),
    ]);
  const matchName = match.name ?? "이름 없는 경기";
  const editorMatch = {
    exportFileBaseName: `${matchName}_${match.match_date ?? "formation"}`,
    formationLabel: match.formation,
    id: match.id,
    matchDate: match.match_date,
    name: matchName,
    quarterCount: match.quarter_count,
  };
  const editorPlayers = players
    .map(toEditorPlayer)
    .filter((player): player is EditorPlayer => Boolean(player));
  const participantIds = new Set(editorPlayers.map((player) => player.id));
  const rosterCandidates: RosterCandidate[] = rosterPlayers
    .map(toRosterCandidate)
    .filter((player) => !participantIds.has(player.id));

  return {
    editor: {
      formationTemplates: formationTemplates.map((template) => ({
        id: template.id,
        label: template.label,
      })),
      match: editorMatch,
      players: editorPlayers,
      quarters: toEditorQuarters(quarters),
      rosterCandidates,
    },
    match: editorMatch,
  };
}

/**
 * 현재 팀의 active 선수 중 경기 명단에 추가 가능한 후보 계산에 필요한 row를 조회합니다.
 */
export async function getRosterPlayers(teamId?: string) {
  const currentTeamId = teamId ?? (await requireCurrentTeamId());
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select(
      "id, name, player_number, main_position, sub_positions, priority_rank",
    )
    .eq("team_id", currentTeamId)
    .eq("is_deleted", false)
    .order("priority_rank", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as RosterPlayerRow[];
}

/**
 * 편집기 초기 렌더링에 필요한 경기, 쿼터 슬롯, 참가자 row를 조회합니다.
 */
async function getMatchFormation({
  matchId,
  teamId,
}: {
  matchId: string;
  teamId: string;
}) {
  const supabase = await createClient();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, name, match_date, quarter_count, formation")
    .eq("id", matchId)
    .eq("team_id", teamId)
    .single();

  if (matchError) {
    throw new Error(matchError.message);
  }

  const { data: quarters, error: quarterError } = await supabase
    .from("quarter_formations")
    .select(
      "quarter_number, formation_slots(id, slot_name, x, y, player_id, guest_player_id, fit_score, is_manual)",
    )
    .eq("match_id", matchId)
    .order("quarter_number", { ascending: true });

  if (quarterError) {
    throw new Error(quarterError.message);
  }

  const { data: matchPlayers, error: matchPlayersError } = await supabase
    .from("match_players")
    .select(
      "is_reduced_quota, players(id, name, player_number, main_position, sub_positions, priority_rank), match_guest_players(id, name, player_number, main_position, sub_positions, priority_rank)",
    )
    .eq("match_id", matchId);

  if (matchPlayersError) {
    throw new Error(matchPlayersError.message);
  }

  return {
    match: match as MatchDetailRow,
    players: (matchPlayers ?? []) as unknown as MatchPlayerRow[],
    quarters: (quarters ?? []) as unknown as FormationQuarterRow[],
  };
}

/**
 * 포메이션 재배정에 필요한 경기, 참가자, 기존 쿼터 슬롯 정보를 한 번에 조회합니다.
 */
export async function getFormationRegenerationContext(
  matchId: string,
): Promise<
  { context: RegenerationContext; ok: true } | { error: string; ok: false }
> {
  const supabase = await createClient();
  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("id, quarter_count, gk_fixed")
    .eq("id", matchId)
    .single();

  if (matchError || !matchData) {
    return { error: "경기 정보를 불러오지 못했습니다.", ok: false };
  }

  const match = matchData as MatchRow;
  const { data: matchPlayersData, error: matchPlayersError } = await supabase
    .from("match_players")
    .select(
      "is_reduced_quota, players(id, name, player_number, main_position, sub_positions, priority_rank), match_guest_players(id, name, player_number, main_position, sub_positions, priority_rank)",
    )
    .eq("match_id", match.id);

  if (matchPlayersError) {
    return { error: "참가 선수 정보를 불러오지 못했습니다.", ok: false };
  }

  const { data: quarterData, error: quarterError } = await supabase
    .from("quarter_formations")
    .select("id, quarter_number, formation_slots(player_id, guest_player_id)")
    .eq("match_id", match.id)
    .order("quarter_number", { ascending: true });

  if (quarterError) {
    return { error: "기존 쿼터 정보를 불러오지 못했습니다.", ok: false };
  }

  return {
    context: {
      match,
      matchPlayers: (matchPlayersData ?? []) as unknown as MatchPlayerRow[],
      quarters: (quarterData ?? []) as unknown as QuarterRow[],
    },
    ok: true,
  };
}

/**
 * 클라이언트 편집 상태 갱신을 위해 경기의 전체 쿼터 슬롯을 editor 타입으로 조회합니다.
 */
export async function getEditorQuartersByMatch(matchId: string): Promise<
  | {
      ok: true;
      quarters: EditorQuarter[];
    }
  | { error: string; ok: false }
> {
  const result = await getInsertedSlotRowsByMatch(matchId);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    quarters: toInsertedEditorQuarters({
      quarterNumberByFormationId: result.quarterNumberByFormationId,
      rows: result.rows,
    }),
  };
}

/**
 * 경기의 전체 쿼터 슬롯 row와 쿼터 번호 매핑을 조회합니다.
 */
async function getInsertedSlotRowsByMatch(matchId: string): Promise<
  | {
      ok: true;
      quarterNumberByFormationId: Map<string, number>;
      rows: InsertedSlotRow[];
    }
  | { error: string; ok: false }
> {
  const supabase = await createClient();
  const { data: quarters, error: quarterError } = await supabase
    .from("quarter_formations")
    .select("id, quarter_number")
    .eq("match_id", matchId)
    .order("quarter_number", { ascending: true });

  if (quarterError || !quarters) {
    return { error: "쿼터 정보를 불러오지 못했습니다.", ok: false };
  }

  const quarterIds = quarters.map((quarter) => quarter.id as string);
  const quarterNumberByFormationId = new Map(
    quarters.map((quarter) => [
      quarter.id as string,
      quarter.quarter_number as number,
    ]),
  );

  if (quarterIds.length === 0) {
    return { quarterNumberByFormationId, rows: [], ok: true };
  }

  const { data: rows, error: slotsError } = await supabase
    .from("formation_slots")
    .select(
      "id, quarter_formation_id, slot_name, x, y, player_id, guest_player_id, fit_score, is_manual",
    )
    .in("quarter_formation_id", quarterIds);

  if (slotsError || !rows) {
    return { error: "포메이션 슬롯을 불러오지 못했습니다.", ok: false };
  }

  return {
    quarterNumberByFormationId,
    rows: rows as unknown as InsertedSlotRow[],
    ok: true,
  };
}
