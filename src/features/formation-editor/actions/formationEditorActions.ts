"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PLAYER_POSITION_CODES } from "@/entities/position";
import {
  replaceFormationSlots,
  updateMatchFormationLabel,
} from "@/features/formation-editor/api/formationEditorMutations";
import {
  getFormationRegenerationContext,
  getInsertedSlotRowsByMatch,
} from "@/features/formation-editor/api/formationEditorQueries";
import type {
  MatchPlayerRow,
  RosterPlayerRow,
} from "@/features/formation-editor/api/formationEditorRows";
import {
  createFormationSlotRows,
  mapInsertedSlotRowsToEditorQuarters,
  mapMatchPlayerRowToFormationPlayer,
  mapRosterPlayerRowToCandidate,
  splitEditorPlayerKey,
} from "@/features/formation-editor/lib/formationEditorMappers";
import { createRegeneratedFormations } from "@/features/formation-editor/lib/regenerateFormationSlots";
import type {
  EditorPlayer,
  EditorQuarter,
  GuestPlayerFormInput,
  RosterCandidate,
} from "@/features/formation-editor/model/types";
import { calculateFitScore } from "@/features/formation-generate/lib/calculateFitScore";
import { getFormationTemplate } from "@/features/formation-template-manage/lib/formationTemplateQueries";
import type { FormationPlayer } from "@/features/match-create/lib/generateQuarterFormations";
import { getGuestPlayerKey } from "@/features/match-create/model/types";
import { createClient } from "@/shared/api/supabase/server";

const slotUpdateSchema = z.array(
  z.object({
    fitScore: z.number().int().min(0).max(10).nullable(),
    id: z.string().uuid(),
    isManual: z.boolean(),
    playerId: z
      .string()
      .regex(/^(player|guest):[0-9a-f-]{36}$/)
      .nullable(),
  }),
);
const regenerationSchema = z.object({
  mode: z.enum(["full", "preserve_players"]),
  templateId: z.string().uuid(),
});
const playerKeySchema = z.string().regex(/^(player|guest):[0-9a-f-]{36}$/);
const guestPlayerSchema = z.object({
  id: z.string().uuid().optional(),
  mainPosition: z.enum(PLAYER_POSITION_CODES),
  name: z.string().trim().min(1),
  playerNumber: z.number().int().min(0).max(999).nullable(),
  subPositions: z.array(z.enum(PLAYER_POSITION_CODES)).default([]),
});

/**
 * 경기 참가자 row 목록을 자동 배치용 선수와 reduced quota key 목록으로 정규화합니다.
 */
function createRegenerationPlayers(matchPlayers: MatchPlayerRow[]) {
  const playerPairs = matchPlayers.map((row) => ({
    isReducedQuota: row.is_reduced_quota,
    player: mapMatchPlayerRowToFormationPlayer(row),
  }));

  return {
    players: playerPairs
      .map(({ player }) => player)
      .filter((player): player is FormationPlayer => Boolean(player)),
    reducedPlayerIds: playerPairs
      .filter(
        (item): item is { isReducedQuota: true; player: FormationPlayer } =>
          item.isReducedQuota && Boolean(item.player),
      )
      .map(({ player }) => player.id),
  };
}

/**
 * 편집기에서 변경한 모든 쿼터 슬롯 배정을 저장합니다.
 */
export async function saveFormationSlots(matchId: string, slots: unknown) {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  const slotsResult = slotUpdateSchema.safeParse(slots);

  if (!matchIdResult.success || !slotsResult.success) {
    return { message: "저장할 포메이션 데이터가 올바르지 않습니다." };
  }

  const supabase = await createClient();
  const updates = await Promise.all(
    slotsResult.data.map((slot) => {
      const { guestPlayerId, playerId } = splitEditorPlayerKey(slot.playerId);

      return supabase
        .from("formation_slots")
        .update({
          fit_score: slot.fitScore,
          guest_player_id: guestPlayerId,
          is_manual: slot.isManual,
          player_id: playerId,
        })
        .eq("id", slot.id);
    }),
  );
  const failed = updates.find(({ error }) => error);

  if (failed?.error) {
    return { message: "포메이션을 저장하지 못했습니다." };
  }

  revalidatePath(`/matches/${matchIdResult.data}`);

  return { message: "저장했습니다.", success: true };
}

/**
 * 팀 정식 선수를 현재 경기 참가 명단에 추가합니다.
 */
export async function addMatchRosterPlayer(
  matchId: string,
  playerId: string,
): Promise<{
  message: string;
  player?: RosterCandidate;
  success?: boolean;
}> {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  const playerIdResult = z.string().uuid().safeParse(playerId);

  if (!matchIdResult.success || !playerIdResult.success) {
    return { message: "추가할 선수 정보가 올바르지 않습니다." };
  }

  const supabase = await createClient();
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, name, player_number, main_position, sub_positions, priority_rank")
    .eq("id", playerIdResult.data)
    .eq("is_deleted", false)
    .single();

  if (playerError || !player) {
    return { message: "추가할 선수를 불러오지 못했습니다." };
  }

  const { error } = await supabase.from("match_players").insert({
    is_reduced_quota: false,
    match_id: matchIdResult.data,
    player_id: playerIdResult.data,
    target_quota: 0,
  });

  if (error) {
    return { message: "선수를 경기 명단에 추가하지 못했습니다." };
  }

  revalidatePath(`/matches/${matchIdResult.data}`);

  return {
    message: "선수를 경기 명단에 추가했습니다.",
    player: mapRosterPlayerRowToCandidate(player as unknown as RosterPlayerRow),
    success: true,
  };
}

/**
 * 경기 참가자를 명단에서 제거하고 배정되어 있던 슬롯을 미배정 처리합니다.
 */
export async function removeMatchParticipant(
  matchId: string,
  playerKey: string,
): Promise<{
  message: string;
  quarters?: EditorQuarter[];
  success?: boolean;
}> {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  const playerKeyResult = playerKeySchema.safeParse(playerKey);

  if (!matchIdResult.success || !playerKeyResult.success) {
    return { message: "제거할 선수 정보가 올바르지 않습니다." };
  }

  const supabase = await createClient();
  const { guestPlayerId, playerId } = splitEditorPlayerKey(playerKeyResult.data);
  const participantId = guestPlayerId ?? playerId;

  if (!participantId) {
    return { message: "제거할 선수 정보가 올바르지 않습니다." };
  }

  const clearResult = await clearParticipantSlots({
    matchId: matchIdResult.data,
    playerKey: playerKeyResult.data,
  });

  if (!clearResult.success) {
    return { message: clearResult.message ?? "배정된 슬롯을 정리하지 못했습니다." };
  }

  let deleteMatchPlayerQuery = supabase
    .from("match_players")
    .delete()
    .eq("match_id", matchIdResult.data);

  deleteMatchPlayerQuery = guestPlayerId
    ? deleteMatchPlayerQuery.eq("guest_player_id", guestPlayerId)
    : deleteMatchPlayerQuery.eq("player_id", playerId);

  const { error: deleteMatchPlayerError } = await deleteMatchPlayerQuery;

  if (deleteMatchPlayerError) {
    return { message: "경기 명단에서 선수를 제거하지 못했습니다." };
  }

  if (guestPlayerId) {
    const { error: deleteGuestError } = await supabase
      .from("match_guest_players")
      .delete()
      .eq("id", guestPlayerId)
      .eq("match_id", matchIdResult.data);

    if (deleteGuestError) {
      return { message: "용병 정보를 삭제하지 못했습니다." };
    }
  }

  const quartersResult = await getEditorQuarters(matchIdResult.data);

  if (!quartersResult.success) {
    return { message: quartersResult.message };
  }

  revalidatePath(`/matches/${matchIdResult.data}`);

  return {
    message: "경기 명단에서 제거했습니다.",
    quarters: quartersResult.quarters,
    success: true,
  };
}

/**
 * 경기 전용 용병을 추가하거나 기존 용병 정보를 수정합니다.
 */
export async function saveMatchGuestPlayer(
  matchId: string,
  input: unknown,
): Promise<{
  message: string;
  player?: EditorPlayer;
  quarters?: EditorQuarter[];
  success?: boolean;
}> {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  const inputResult = guestPlayerSchema.safeParse(input);

  if (!matchIdResult.success || !inputResult.success) {
    return { message: "용병 정보가 올바르지 않습니다." };
  }

  const guest = normalizeGuestInput(inputResult.data);
  const supabase = await createClient();
  let guestId = guest.id;
  let priorityRank = 1;

  if (guestId) {
    const { data: updatedGuest, error: updateError } = await supabase
      .from("match_guest_players")
      .update({
        main_position: guest.mainPosition,
        name: guest.name,
        player_number: guest.playerNumber,
        sub_positions: guest.subPositions,
      })
      .eq("id", guestId)
      .eq("match_id", matchIdResult.data)
      .select("priority_rank")
      .single();

    if (updateError || !updatedGuest) {
      return { message: "용병 정보를 수정하지 못했습니다." };
    }

    priorityRank = updatedGuest.priority_rank as number;
    await updateGuestSlotFitScores({
      guest,
      guestId,
      matchId: matchIdResult.data,
    });
  } else {
    priorityRank = await getNextGuestPriorityRank(matchIdResult.data);
    const { data: insertedGuest, error: insertGuestError } = await supabase
      .from("match_guest_players")
      .insert({
        main_position: guest.mainPosition,
        match_id: matchIdResult.data,
        name: guest.name,
        player_number: guest.playerNumber,
        priority_rank: priorityRank,
        sub_positions: guest.subPositions,
      })
      .select("id")
      .single();

    if (insertGuestError || !insertedGuest) {
      return { message: "용병 정보를 추가하지 못했습니다." };
    }

    guestId = insertedGuest.id as string;
    const { error: matchPlayerError } = await supabase
      .from("match_players")
      .insert({
        guest_player_id: guestId,
        is_reduced_quota: false,
        match_id: matchIdResult.data,
        target_quota: 0,
      });

    if (matchPlayerError) {
      return { message: "용병을 경기 명단에 추가하지 못했습니다." };
    }
  }

  const quartersResult = await getEditorQuarters(matchIdResult.data);

  if (!quartersResult.success) {
    return { message: quartersResult.message };
  }

  revalidatePath(`/matches/${matchIdResult.data}`);

  return {
    message: guest.id ? "용병 정보를 수정했습니다." : "용병을 추가했습니다.",
    player: {
      id: getGuestPlayerKey(guestId),
      isGuest: true,
      mainPosition: guest.mainPosition,
      name: guest.name,
      playerNumber: guest.playerNumber,
      priorityRank,
      subPositions: guest.subPositions,
    },
    quarters: quartersResult.quarters,
    success: true,
  };
}

/**
 * 경기 포메이션 템플릿을 바꾸고 선택한 재배정 방식으로 모든 쿼터 슬롯을 교체합니다.
 */
export async function regenerateMatchFormation(
  matchId: string,
  input: unknown,
): Promise<{
  formationLabel?: string;
  message: string;
  quarters?: EditorQuarter[];
  success?: boolean;
}> {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  const inputResult = regenerationSchema.safeParse(input);

  if (!matchIdResult.success || !inputResult.success) {
    return { message: "재배정할 포메이션 데이터가 올바르지 않습니다." };
  }

  const { mode, templateId } = inputResult.data;
  const preset = await getFormationTemplate(templateId);

  if (!preset) {
    return { message: "지원하지 않는 포메이션입니다." };
  }

  if (preset.slots.length !== 11) {
    return { message: "포메이션 슬롯은 11개여야 합니다." };
  }

  const contextResult = await getFormationRegenerationContext(matchIdResult.data);

  if (!contextResult.ok) {
    return { message: contextResult.error };
  }

  const { match, matchPlayers, quarters } = contextResult.context;
  const { players, reducedPlayerIds } = createRegenerationPlayers(matchPlayers);

  if (players.length < preset.slots.length) {
    return {
      message: `${preset.label} 포메이션은 최소 ${preset.slots.length}명이 필요합니다.`,
    };
  }

  const quarterFormationIdByNumber = new Map(
    quarters.map((quarter) => [quarter.quarter_number, quarter.id]),
  );
  const quarterNumberByFormationId = new Map(
    quarters.map((quarter) => [quarter.id, quarter.quarter_number]),
  );

  if (quarters.length !== match.quarter_count) {
    return { message: "쿼터 포메이션 수가 경기 설정과 일치하지 않습니다." };
  }

  let generatedFormations;

  try {
    generatedFormations = createRegeneratedFormations({
      match,
      mode,
      players,
      preset,
      quarters,
      reducedPlayerIds,
    });
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "포메이션을 재배정하지 못했습니다.",
    };
  }

  const slotRows = createFormationSlotRows({
    formations: generatedFormations,
    quarterFormationIdByNumber,
  });
  const replaceResult = await replaceFormationSlots({ quarters, slotRows });

  if (!replaceResult.ok) {
    return { message: replaceResult.error };
  }

  const matchUpdateError = await updateMatchFormationLabel({
    formationLabel: preset.label,
    matchId: match.id,
  });

  if (matchUpdateError) {
    return { message: matchUpdateError };
  }

  revalidatePath(`/matches/${match.id}`);

  return {
    formationLabel: preset.label,
    message: "포메이션을 변경하고 재배정했습니다.",
    quarters: mapInsertedSlotRowsToEditorQuarters({
      quarterNumberByFormationId,
      rows: replaceResult.insertedSlots,
    }),
    success: true,
  };
}

/**
 * match id 기준 최신 쿼터 슬롯을 편집기 상태로 변환합니다.
 */
async function getEditorQuarters(matchId: string) {
  const result = await getInsertedSlotRowsByMatch(matchId);

  if (!result.ok) {
    return { message: result.error, success: false as const };
  }

  return {
    quarters: mapInsertedSlotRowsToEditorQuarters({
      quarterNumberByFormationId: result.quarterNumberByFormationId,
      rows: result.rows,
    }),
    success: true as const,
  };
}

/**
 * 참가자 제거 전에 해당 선수가 배정된 모든 슬롯을 미배정 상태로 변경합니다.
 */
async function clearParticipantSlots({
  matchId,
  playerKey,
}: {
  matchId: string;
  playerKey: string;
}) {
  const supabase = await createClient();
  const { guestPlayerId, playerId } = splitEditorPlayerKey(playerKey);
  const participantId = guestPlayerId ?? playerId;
  const slotColumn = guestPlayerId ? "guest_player_id" : "player_id";

  if (!participantId) {
    return { message: "제거할 선수 정보가 올바르지 않습니다.", success: false };
  }

  const { data: quarters, error: quarterError } = await supabase
    .from("quarter_formations")
    .select("id")
    .eq("match_id", matchId);

  if (quarterError || !quarters) {
    return { message: "쿼터 정보를 불러오지 못했습니다.", success: false };
  }

  const quarterIds = quarters.map((quarter) => quarter.id as string);

  if (quarterIds.length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from("formation_slots")
    .update({
      fit_score: null,
      guest_player_id: null,
      is_manual: true,
      player_id: null,
    })
    .in("quarter_formation_id", quarterIds)
    .eq(slotColumn, participantId);

  if (error) {
    return { message: "배정된 슬롯을 정리하지 못했습니다.", success: false };
  }

  return { success: true };
}

/**
 * 용병 입력값에서 주 포지션과 중복되는 부 포지션을 제거합니다.
 */
function normalizeGuestInput(
  input: z.infer<typeof guestPlayerSchema>,
): GuestPlayerFormInput {
  return {
    ...input,
    name: input.name.trim(),
    subPositions: [...new Set(input.subPositions)].filter(
      (position) => position !== input.mainPosition,
    ),
  };
}

/**
 * 새 용병이 기존 참가자보다 낮은 우선순위를 갖도록 다음 priority rank를 계산합니다.
 */
async function getNextGuestPriorityRank(matchId: string) {
  const contextResult = await getFormationRegenerationContext(matchId);

  if (!contextResult.ok) return 1;

  const maxRank = Math.max(
    0,
    ...contextResult.context.matchPlayers
      .map(mapMatchPlayerRowToFormationPlayer)
      .filter((player): player is FormationPlayer => Boolean(player))
      .map((player) => player.priorityRank),
  );

  return maxRank + 1;
}

/**
 * 용병 포지션 수정 후 이미 배정된 슬롯의 fit score를 최신 포지션 기준으로 갱신합니다.
 */
async function updateGuestSlotFitScores({
  guest,
  guestId,
  matchId,
}: {
  guest: GuestPlayerFormInput;
  guestId: string;
  matchId: string;
}) {
  const supabase = await createClient();
  const { data: quarters } = await supabase
    .from("quarter_formations")
    .select("id")
    .eq("match_id", matchId);
  const quarterIds = (quarters ?? []).map((quarter) => quarter.id as string);

  if (quarterIds.length === 0) return;

  const { data: slots } = await supabase
    .from("formation_slots")
    .select("id, slot_name")
    .in("quarter_formation_id", quarterIds)
    .eq("guest_player_id", guestId);

  await Promise.all(
    (slots ?? []).map((slot) =>
      supabase
        .from("formation_slots")
        .update({
          fit_score: calculateFitScore({
            mainPosition: guest.mainPosition,
            slotPosition: slot.slot_name,
            subPositions: guest.subPositions,
          }),
        })
        .eq("id", slot.id),
    ),
  );
}
