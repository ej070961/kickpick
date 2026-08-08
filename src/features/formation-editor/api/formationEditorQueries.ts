import { createClient } from "@/shared/api/supabase/server";
import type {
  InsertedSlotRow,
  MatchPlayerRow,
  MatchRow,
  QuarterRow,
} from "./formationEditorRows";

type RegenerationContext = {
  match: MatchRow;
  matchPlayers: MatchPlayerRow[];
  quarters: QuarterRow[];
};

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
 * 클라이언트 편집 상태 갱신을 위해 경기의 전체 쿼터 슬롯 row를 조회합니다.
 */
export async function getInsertedSlotRowsByMatch(matchId: string): Promise<
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
