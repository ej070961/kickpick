"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  PLAYER_POSITION_CODES,
  type PlayerPositionCode,
} from "@/entities/position";
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
import {
  getGuestPlayerKey,
  getIdFromPlayerKey,
  getRosterPlayerKey,
  isGuestPlayerKey,
} from "@/features/match-create/model/types";
import { createClient } from "@/shared/api/supabase/server";

export type MatchCreateState = {
  errors?: {
    formation?: string[];
    guestPlayers?: string[];
    matchDate?: string[];
    name?: string[];
    playerIds?: string[];
    playerKeys?: string[];
    quarterCount?: string[];
    reducedPlayerIds?: string[];
  };
  message?: string;
};

const playerKeySchema = z.string().regex(/^(player|guest):[0-9a-f-]{36}$/);
const playerPositionSchema = z.enum(PLAYER_POSITION_CODES);

const matchCreateSchema = z.object({
  formation: z.string().uuid("포메이션 템플릿을 먼저 생성해주세요."),
  gkFixed: z.boolean(),
  guestPlayers: z.array(
    z.object({
      clientId: z.string().uuid(),
      mainPosition: playerPositionSchema,
      name: z.string().trim().min(1, "용병 이름을 입력해주세요."),
      playerNumber: z.number().int().min(0).max(999).nullable(),
      subPositions: z.array(playerPositionSchema).default([]),
    }),
  ),
  matchDate: z.string().optional(),
  name: z.string().optional(),
  playerKeys: z.array(playerKeySchema).min(1, "참가 선수를 선택해주세요."),
  quarterCount: z.coerce
    .number()
    .int()
    .min(1, "쿼터 수는 1 이상이어야 합니다.")
    .max(8, "쿼터 수는 8 이하이어야 합니다."),
  reducedPlayerIds: z.array(playerKeySchema).default([]),
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
    id: getRosterPlayerKey(row.id),
    mainPosition: row.main_position,
    name: row.name,
    playerNumber: row.player_number,
    priorityRank: row.priority_rank,
    subPositions: row.sub_positions,
  };
}

/**
 * JSON 문자열로 제출된 용병 목록을 서버 검증용 객체로 변환합니다.
 */
function parseGuestPlayers(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    guestPlayers: parseGuestPlayers(formData.get("guestPlayers")),
    matchDate: String(formData.get("matchDate") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    playerKeys: formData.getAll("playerKeys").map(String),
    quarterCount: formData.get("quarterCount"),
    reducedPlayerIds: formData.getAll("reducedPlayerIds").map(String),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    formation,
    gkFixed,
    guestPlayers,
    matchDate,
    name,
    playerKeys,
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

  if (playerKeys.length < preset.slots.length) {
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
  const rosterPlayerIds = playerKeys
    .filter((playerKey) => !isGuestPlayerKey(playerKey))
    .map(getIdFromPlayerKey);
  const guestPlayerKeys = new Set(
    guestPlayers.map((guest) => getGuestPlayerKey(guest.clientId)),
  );
  const hasMissingGuest = playerKeys.some(
    (playerKey) => isGuestPlayerKey(playerKey) && !guestPlayerKeys.has(playerKey),
  );

  if (hasMissingGuest) {
    return { errors: { guestPlayers: ["사용할 수 없는 용병이 포함되어 있습니다."] } };
  }

  let rosterPlayers: FormationPlayer[] = [];

  if (rosterPlayerIds.length > 0) {
    const { data: playerRows, error: playersError } = await supabase
      .from("players")
      .select("id, name, player_number, main_position, sub_positions, priority_rank")
      .eq("team_id", teamId)
      .eq("is_deleted", false)
      .in("id", rosterPlayerIds);

    if (playersError) {
      return { message: "참가 선수 정보를 불러오지 못했습니다." };
    }

    rosterPlayers = (playerRows ?? []).map((row) =>
      mapPlayer(row as PlayerRow),
    );
  }

  if (rosterPlayers.length !== rosterPlayerIds.length) {
    return { message: "선택한 선수 중 사용할 수 없는 선수가 있습니다." };
  }

  const guestPriorityStart =
    Math.max(0, ...rosterPlayers.map((player) => player.priorityRank)) + 1;
  const guestFormationPlayers: FormationPlayer[] = guestPlayers.map(
    (guest, index) => ({
      id: getGuestPlayerKey(guest.clientId),
      mainPosition: guest.mainPosition,
      name: guest.name,
      playerNumber: guest.playerNumber,
      priorityRank: guestPriorityStart + index,
      subPositions: guest.subPositions.filter(
        (position) => position !== guest.mainPosition,
      ),
    }),
  );
  const players = [...rosterPlayers, ...guestFormationPlayers].filter((player) =>
    playerKeys.includes(player.id),
  );

  if (players.length !== playerKeys.length) {
    return { message: "참가 선수 목록을 확인하지 못했습니다." };
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
  const insertedGuestIdByClientKey = new Map<string, string>();

  if (guestPlayers.length > 0) {
    const { data: insertedGuests, error: guestsError } = await supabase
      .from("match_guest_players")
      .insert(
        guestPlayers.map((guest, index) => ({
          main_position: guest.mainPosition,
          match_id: matchId,
          name: guest.name,
          player_number: guest.playerNumber,
          priority_rank: guestPriorityStart + index,
          sub_positions: guest.subPositions.filter(
            (position) => position !== guest.mainPosition,
          ),
        })),
      )
      .select("id");

    if (guestsError || !insertedGuests) {
      return { message: "용병 정보를 저장하지 못했습니다." };
    }

    if (insertedGuests.length !== guestPlayers.length) {
      return { message: "용병 정보를 확인하지 못했습니다." };
    }

    insertedGuests.forEach((guest, index) => {
      const clientKey = getGuestPlayerKey(guestPlayers[index]?.clientId ?? "");
      insertedGuestIdByClientKey.set(clientKey, guest.id as string);
    });
  }

  const { error: matchPlayersError } = await supabase
    .from("match_players")
    .insert(
      players.map((player) => ({
        guest_player_id: isGuestPlayerKey(player.id)
          ? (insertedGuestIdByClientKey.get(player.id) ?? null)
          : null,
        is_reduced_quota: reducedPlayerIds.includes(player.id),
        match_id: matchId,
        player_id: isGuestPlayerKey(player.id) ? null : getIdFromPlayerKey(player.id),
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

    const slotRows = formationItem.slots.map((slot) => {
      const isGuest = slot.playerId ? isGuestPlayerKey(slot.playerId) : false;
      const guestPlayerId = slot.playerId
        ? insertedGuestIdByClientKey.get(slot.playerId)
        : null;

      return {
        fit_score: slot.fitScore,
        guest_player_id: isGuest ? (guestPlayerId ?? null) : null,
        is_manual: slot.isManual,
        player_id:
          slot.playerId && !isGuest ? getIdFromPlayerKey(slot.playerId) : null,
        quarter_formation_id: quarterFormation.id,
        slot_name: slot.name,
        x: slot.x,
        y: slot.y,
      };
    });
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
