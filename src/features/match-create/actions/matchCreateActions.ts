"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  PLAYER_POSITION_CODES,
  type PlayerPositionCode,
} from "@/entities/position";
import { requireCurrentTeamId } from "@/entities/team";
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
      name: z.string().trim().min(1, "게스트 이름을 입력해주세요."),
      playerNumber: z.number().int().min(0).max(999).nullable(),
      subPositions: z.array(playerPositionSchema).default([]),
    }),
  ),
  matchDate: z.string().optional(),
  name: z.string().optional(),
  playerKeys: z.array(playerKeySchema).min(1, "참가 명단을 선택해주세요."),
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

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type QuarterFormationRow = {
  id: string;
  quarter_number: number;
};

/**
 * 경기명이 비어 있을 때 날짜 기반 기본 경기명을 만듭니다.
 */
function getDefaultMatchName(matchDate: string) {
  return `${matchDate || getTodayDate()} 경기`;
}

/**
 * 서버 기본 타임존 기준의 yyyy-mm-dd 날짜 문자열을 반환합니다.
 */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
 * JSON 문자열로 제출된 게스트 목록을 서버 검증용 객체로 변환합니다.
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
 * 경기 생성 중간 저장 실패 시 먼저 만들어진 match와 하위 row를 정리합니다.
 */
async function cleanupCreatedMatch({
  matchId,
  reason,
  supabase,
}: {
  matchId: string;
  reason: string;
  supabase: SupabaseServerClient;
}) {
  const { error } = await supabase.from("matches").delete().eq("id", matchId);

  if (error) {
    console.error("Failed to cleanup partially created match", {
      error,
      matchId,
      reason,
    });
  }
}

/**
 * 경기 생성 formData를 검증하고 경기, 참가 명단, 쿼터별 포메이션 슬롯을 저장합니다.
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
  const matchName = name || getDefaultMatchName(matchDate ?? "");
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
          `${preset.label} 포메이션은 최소 ${preset.slots.length}명이 필요해요.`,
        ],
      },
    };
  }

  const supabase = await createClient();
  const teamId = await requireCurrentTeamId();
  const registeredPlayerIds = playerKeys
    .filter((playerKey) => !isGuestPlayerKey(playerKey))
    .map(getIdFromPlayerKey);
  const guestPlayerKeys = new Set(
    guestPlayers.map((guest) => getGuestPlayerKey(guest.clientId)),
  );
  const hasMissingGuest = playerKeys.some(
    (playerKey) =>
      isGuestPlayerKey(playerKey) && !guestPlayerKeys.has(playerKey),
  );

  if (hasMissingGuest) {
    return {
      errors: { guestPlayers: ["사용할 수 없는 게스트가 포함되어 있습니다."] },
    };
  }

  let rosterPlayers: FormationPlayer[] = [];

  if (registeredPlayerIds.length > 0) {
    const { data: playerRows, error: playersError } = await supabase
      .from("players")
      .select(
        "id, name, player_number, main_position, sub_positions, priority_rank",
      )
      .eq("team_id", teamId)
      .eq("is_deleted", false)
      .in("id", registeredPlayerIds);

    if (playersError) {
      return { message: "참가 명단을 불러오지 못했습니다." };
    }

    rosterPlayers = (playerRows ?? []).map((row) =>
      mapPlayer(row as PlayerRow),
    );
  }

  if (rosterPlayers.length !== registeredPlayerIds.length) {
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
  const players = [...rosterPlayers, ...guestFormationPlayers].filter(
    (player) => playerKeys.includes(player.id),
  );

  if (players.length !== playerKeys.length) {
    return { message: "참가 명단을 확인하지 못했습니다." };
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
        reducedPlayerIds: ["출전 시간 조정 대상이 올바르지 않아요."],
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
        reducedPlayerIds: [
          "출전 시간 계산에 포함된 선수 중에서만 선택할 수 있어요.",
        ],
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
      name: matchName,
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
      await cleanupCreatedMatch({
        matchId,
        reason: "match_guest_players insert failed",
        supabase,
      });
      return { message: "게스트 정보를 저장하지 못했습니다." };
    }

    if (insertedGuests.length !== guestPlayers.length) {
      await cleanupCreatedMatch({
        matchId,
        reason: "match_guest_players insert count mismatch",
        supabase,
      });
      return { message: "게스트 정보를 확인하지 못했습니다." };
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
        player_id: isGuestPlayerKey(player.id)
          ? null
          : getIdFromPlayerKey(player.id),
        target_quota: generated.targetQuotas.get(player.id) ?? 0,
      })),
    );

  if (matchPlayersError) {
    await cleanupCreatedMatch({
      matchId,
      reason: "match_players insert failed",
      supabase,
    });
    return { message: "참가 명단 배정을 저장하지 못했습니다." };
  }

  const { data: quarterFormations, error: quarterError } = await supabase
    .from("quarter_formations")
    .insert(
      generated.formations.map((formationItem) => ({
        match_id: matchId,
        quarter_number: formationItem.quarterNumber,
      })),
    )
    .select("id, quarter_number");

  if (quarterError || !quarterFormations) {
    console.error("Failed to create quarter formations", {
      error: quarterError,
      matchId,
    });

    await cleanupCreatedMatch({
      matchId,
      reason: "quarter_formations insert failed",
      supabase,
    });

    return { message: "쿼터 포메이션을 저장하지 못했습니다." };
  }

  if (quarterFormations.length !== generated.formations.length) {
    await cleanupCreatedMatch({
      matchId,
      reason: "quarter_formations insert count mismatch",
      supabase,
    });
    return { message: "쿼터 포메이션을 확인하지 못했습니다." };
  }

  const quarterFormationIdByNumber = new Map(
    (quarterFormations as QuarterFormationRow[]).map((quarterFormation) => [
      quarterFormation.quarter_number,
      quarterFormation.id,
    ]),
  );
  const hasMissingQuarterFormation = generated.formations.some(
    (formationItem) =>
      !quarterFormationIdByNumber.has(formationItem.quarterNumber),
  );

  if (hasMissingQuarterFormation) {
    await cleanupCreatedMatch({
      matchId,
      reason: "quarter_formations id mapping mismatch",
      supabase,
    });
    return { message: "쿼터 포메이션을 확인하지 못했습니다." };
  }

  const slotRows = generated.formations.flatMap((formationItem) => {
    const quarterFormationId = quarterFormationIdByNumber.get(
      formationItem.quarterNumber,
    ) as string;

    return formationItem.slots.map((slot) => {
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
        quarter_formation_id: quarterFormationId,
        slot_name: slot.name,
        x: slot.x,
        y: slot.y,
      };
    });
  });
  const { error: slotsError } = await supabase
    .from("formation_slots")
    .insert(slotRows);

  if (slotsError) {
    console.error("Failed to create formation slots", {
      error: slotsError,
      matchId,
      slots: slotRows,
    });

    await cleanupCreatedMatch({
      matchId,
      reason: "formation_slots insert failed",
      supabase,
    });

    return {
      message: `포메이션 슬롯을 저장하지 못했습니다. (${slotsError.message})`,
    };
  }

  redirect(`/matches/${matchId}`);
}
