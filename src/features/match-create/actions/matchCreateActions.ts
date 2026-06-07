"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { PlayerPositionCode } from "@/entities/position";
import { getFormationTemplate } from "@/features/formation-template-manage/lib/formationTemplateQueries";
import {
  generateQuarterFormations,
  type FormationPlayer,
} from "@/features/match-create/lib/generateQuarterFormations";
import {
  getQuotaPlayers,
  getQuotaSlotsPerQuarter,
  getRequiredReducedPlayerCount,
} from "@/features/match-create/model/quotaSelection";
import { createClient } from "@/shared/api/supabase/server";

export type MatchCreateState = {
  errors?: {
    formation?: string[];
    matchDate?: string[];
    name?: string[];
    playerIds?: string[];
    quarterCount?: string[];
    reducedPlayerIds?: string[];
  };
  message?: string;
};

const matchCreateSchema = z.object({
  formation: z.string().uuid("포메이션을 선택해주세요."),
  gkFixed: z.boolean(),
  matchDate: z.string().optional(),
  name: z.string().optional(),
  playerIds: z.array(z.string().uuid()).min(1, "참가 선수를 선택해주세요."),
  quarterCount: z.coerce
    .number()
    .int()
    .min(1, "쿼터 수는 1 이상이어야 합니다.")
    .max(8, "쿼터 수는 8 이하이어야 합니다."),
  reducedPlayerIds: z.array(z.string().uuid()).default([]),
});

type PlayerRow = {
  id: string;
  main_position: PlayerPositionCode;
  name: string;
  player_number: number | null;
  priority_rank: number;
  sub_positions: PlayerPositionCode[];
};

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
 * Supabase player row를 포메이션 생성 알고리즘에서 사용하는 선수 모델로 변환합니다.
 */
function mapPlayer(row: PlayerRow): FormationPlayer {
  return {
    id: row.id,
    mainPosition: row.main_position,
    name: row.name,
    playerNumber: row.player_number,
    priorityRank: row.priority_rank,
    subPositions: row.sub_positions,
  };
}

/**
 * 경기 생성 formData를 검증하고 경기, 참가 선수, 쿼터별 포메이션 슬롯을 저장합니다.
 */
export async function createMatch(
  _state: MatchCreateState,
  formData: FormData,
): Promise<MatchCreateState> {
  const validatedFields = matchCreateSchema.safeParse({
    formation: formData.get("formation"),
    gkFixed: formData.get("gkFixed") === "on",
    matchDate: String(formData.get("matchDate") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    playerIds: formData.getAll("playerIds").map(String),
    quarterCount: formData.get("quarterCount"),
    reducedPlayerIds: formData.getAll("reducedPlayerIds").map(String),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    formation,
    gkFixed,
    matchDate,
    name,
    playerIds,
    quarterCount,
    reducedPlayerIds,
  } = validatedFields.data;
  const preset = await getFormationTemplate(formation);

  if (!preset) {
    return { errors: { formation: ["지원하지 않는 포메이션입니다."] } };
  }

  if (preset.slots.length !== 11) {
    return { errors: { formation: ["포메이션 슬롯은 11개여야 합니다."] } };
  }

  if (playerIds.length < preset.slots.length) {
    return {
      errors: {
        playerIds: [
          `${preset.label} 포메이션은 최소 ${preset.slots.length}명이 필요합니다.`,
        ],
      },
    };
  }

  const supabase = await createClient();
  const teamId = await getCurrentTeamId();
  const { data: playerRows, error: playersError } = await supabase
    .from("players")
    .select("id, name, player_number, main_position, sub_positions, priority_rank")
    .eq("team_id", teamId)
    .eq("is_deleted", false)
    .in("id", playerIds);

  if (playersError) {
    return { message: "참가 선수 정보를 불러오지 못했습니다." };
  }

  const players = (playerRows ?? []).map((row) =>
    mapPlayer(row as PlayerRow),
  );

  if (players.length !== playerIds.length) {
    return { message: "선택한 선수 중 사용할 수 없는 선수가 있습니다." };
  }

  const { quotaPlayers } = getQuotaPlayers({ gkFixed, players });
  const quotaSlotsPerQuarter = getQuotaSlotsPerQuarter({
    gkFixed,
    slotsPerQuarter: preset.slots.length,
  });
  const requiredReducedCount = getRequiredReducedPlayerCount({
    playerCount: quotaPlayers.length,
    quarterCount,
    slotsPerQuarter: quotaSlotsPerQuarter,
  });

  if (reducedPlayerIds.length !== requiredReducedCount) {
    return {
      errors: {
        reducedPlayerIds: ["쿼터 보정 선수 선택값이 올바르지 않습니다."],
      },
    };
  }

  const quotaPlayerIdSet = new Set(quotaPlayers.map((player) => player.id));
  const hasInvalidReducedPlayer = reducedPlayerIds.some(
    (playerId) => !quotaPlayerIdSet.has(playerId),
  );

  if (hasInvalidReducedPlayer) {
    return {
      errors: {
        reducedPlayerIds: ["쿼터 보정 대상 선수 중에서만 선택할 수 있습니다."],
      },
    };
  }

  let generated;

  try {
    generated = generateQuarterFormations({
      gkFixed,
      players,
      preset,
      quarterCount,
      reducedPlayerIds,
    });
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "포메이션을 생성하지 못했습니다.",
    };
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      formation: preset.label,
      gk_fixed: gkFixed,
      match_date: matchDate || null,
      name: name || null,
      quarter_count: quarterCount,
      status: "generated",
      team_id: teamId,
    })
    .select("id")
    .single();

  if (matchError) {
    return { message: "경기를 저장하지 못했습니다." };
  }

  const matchId = match.id as string;
  const { error: matchPlayersError } = await supabase
    .from("match_players")
    .insert(
      players.map((player) => ({
        is_reduced_quota: reducedPlayerIds.includes(player.id),
        match_id: matchId,
        player_id: player.id,
        target_quota: generated.targetQuotas.get(player.id) ?? 0,
      })),
    );

  if (matchPlayersError) {
    return { message: "참가 선수 배정을 저장하지 못했습니다." };
  }

  for (const formationItem of generated.formations) {
    const { data: quarterFormation, error: quarterError } = await supabase
      .from("quarter_formations")
      .insert({
        match_id: matchId,
        quarter_number: formationItem.quarterNumber,
      })
      .select("id")
      .single();

    if (quarterError) {
      console.error("Failed to create quarter formation", {
        error: quarterError,
        matchId,
        quarterNumber: formationItem.quarterNumber,
      });

      return { message: "쿼터 포메이션을 저장하지 못했습니다." };
    }

    const slotRows = formationItem.slots.map((slot) => ({
        fit_score: slot.fitScore,
        is_manual: slot.isManual,
        player_id: slot.playerId,
        quarter_formation_id: quarterFormation.id,
        slot_name: slot.name,
        x: slot.x,
        y: slot.y,
      }));
    const { error: slotsError } = await supabase
      .from("formation_slots")
      .insert(slotRows);

    if (slotsError) {
      console.error("Failed to create formation slots", {
        error: slotsError,
        quarterFormationId: quarterFormation.id,
        quarterNumber: formationItem.quarterNumber,
        slots: slotRows,
      });

      return {
        message: `포메이션 슬롯을 저장하지 못했습니다. (${slotsError.message})`,
      };
    }
  }

  redirect(`/matches/${matchId}`);
}
