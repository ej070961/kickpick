import { createClient } from "@/shared/api/supabase/server";
import { requireCurrentTeamId } from "@/entities/team";
import {
  toEditorPlayer,
  toEditorQuarters,
  toInsertedEditorQuarters,
  toAvailablePlayer,
  toFormationPlayer,
  toPreserveQuarterInputs,
} from "@/features/formation-editor/api/mappers";
import type {
  EditorPlayer,
  EditorQuarter,
  EditorPageMatch,
  AvailablePlayer,
} from "@/features/formation-editor/model/types";
import type {
  FormationQuarterRow,
  InsertedSlotRow,
  MatchDetailRow,
  MatchPlayerRow,
  MatchRow,
  QuarterRow,
  RegisteredPlayerRow,
} from "./dbRows";
import type { FormationPlayer } from "@/features/formation-generate/model/types";

type RegenerationContext = {
  match: Pick<MatchRow, "gk_fixed" | "id" | "quarter_count">;
  participants: { isReducedQuota: boolean; player: FormationPlayer }[];
  quarterFormations: { id: string; quarterNumber: number }[];
  preservedQuarters: { playerIds: string[]; quarterNumber: number }[];
};

/**
 * 현재 경기에 속한 활성 팀 선수 중 아직 참가자가 아닌 등록 선수를 조회합니다.
 */
export const getMatchPlayerCandidates = async (
  matchId: string,
): Promise<AvailablePlayer[]> => {
  const teamId = await requireCurrentTeamId();
  const supabase = await createClient();

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id")
    .eq("id", matchId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (matchError) throw new Error(matchError.message);
  if (!match) throw new Error("경기 정보를 찾을 수 없습니다.");

  const [
    { data: players, error: playersError },
    { data: participants, error: participantsError },
  ] = await Promise.all([
    supabase
      .from("players")
      .select(
        "id, name, player_number, main_position, sub_positions, priority_rank",
      )
      .eq("team_id", teamId)
      .eq("is_deleted", false)
      .order("priority_rank", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("match_players").select("player_id").eq("match_id", matchId),
  ]);

  if (playersError) throw new Error(playersError.message);
  if (participantsError) throw new Error(participantsError.message);

  const participantIds = new Set(
    (participants ?? [])
      .map(({ player_id }) => player_id)
      .filter((playerId): playerId is string => Boolean(playerId)),
  );

  return ((players ?? []) as unknown as RegisteredPlayerRow[])
    .filter((player) => !participantIds.has(player.id))
    .map(toAvailablePlayer);
};

/** 경기 참가 명단의 정식 선수와 게스트를 자동 배치 모델로 반환합니다. */
export const getMatchParticipants = async (
  matchId: string,
): Promise<FormationPlayer[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_players")
    .select(
      "players(id, name, player_number, main_position, sub_positions, priority_rank), match_guest_players(id, name, player_number, main_position, sub_positions, priority_rank)",
    )
    .eq("match_id", matchId);

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as MatchPlayerRow[])
    .map(toFormationPlayer)
    .filter((player): player is FormationPlayer => Boolean(player));
};

/**
 * 초기 편집 화면에 필요한 경기, 쿼터 슬롯, 참가자 row를 조회합니다.
 */
export const getEditorMatchData = async ({
  matchId,
  teamId,
}: {
  matchId: string;
  teamId: string;
}): Promise<{
  match: EditorPageMatch;
  players: EditorPlayer[];
  quarters: EditorQuarter[];
}> => {
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

  const matchRow = match as MatchDetailRow;
  const editorPlayers = ((matchPlayers ?? []) as unknown as MatchPlayerRow[])
    .map(toEditorPlayer)
    .filter((player): player is EditorPlayer => Boolean(player));
  const matchName = matchRow.name ?? "이름 없는 경기";

  return {
    match: {
      exportFileBaseName: `${matchName}_${matchRow.match_date ?? "formation"}`,
      formationLabel: matchRow.formation,
      id: matchRow.id,
      name: matchName,
      quarterCount: matchRow.quarter_count,
    },
    players: editorPlayers,
    quarters: toEditorQuarters(
      (quarters ?? []) as unknown as FormationQuarterRow[],
    ),
  };
};

/**
 * 포메이션 재배정에 필요한 경기, 참가자, 기존 쿼터 슬롯 정보를 한 번에 조회합니다.
 */
export const getFormationRegenerationContext = async (
  matchId: string,
): Promise<
  { context: RegenerationContext; ok: true } | { error: string; ok: false }
> => {
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

  const matchPlayers = (matchPlayersData ?? []) as unknown as MatchPlayerRow[];
  const quarters = (quarterData ?? []) as unknown as QuarterRow[];

  return {
    context: {
      match: {
        gk_fixed: match.gk_fixed,
        id: match.id,
        quarter_count: match.quarter_count,
      },
      participants: matchPlayers.flatMap((row) => {
        const player = toFormationPlayer(row);
        return player ? [{ isReducedQuota: row.is_reduced_quota, player }] : [];
      }),
      quarterFormations: quarters.map((quarter) => ({
        id: quarter.id,
        quarterNumber: quarter.quarter_number,
      })),
      preservedQuarters: toPreserveQuarterInputs(quarters),
    },
    ok: true,
  };
};

/**
 * 클라이언트 편집 상태 갱신을 위해 경기의 전체 쿼터 슬롯을 editor 타입으로 조회합니다.
 */
export const getEditorQuartersByMatch = async (
  matchId: string,
): Promise<
  | {
      ok: true;
      quarters: EditorQuarter[];
    }
  | { error: string; ok: false }
> => {
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
};

/**
 * 경기의 전체 쿼터 슬롯 row와 쿼터 번호 매핑을 조회합니다.
 */
const getInsertedSlotRowsByMatch = async (
  matchId: string,
): Promise<
  | {
      ok: true;
      quarterNumberByFormationId: Map<string, number>;
      rows: InsertedSlotRow[];
    }
  | { error: string; ok: false }
> => {
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
};
