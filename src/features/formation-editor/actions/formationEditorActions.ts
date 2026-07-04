"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  replaceFormationSlots,
  updateMatchFormationLabel,
} from "@/features/formation-editor/api/formationEditorMutations";
import { getFormationRegenerationContext } from "@/features/formation-editor/api/formationEditorQueries";
import type { MatchPlayerRow } from "@/features/formation-editor/api/formationEditorRows";
import {
  createFormationSlotRows,
  mapInsertedSlotRowsToEditorQuarters,
  mapMatchPlayerRowToFormationPlayer,
  splitEditorPlayerKey,
} from "@/features/formation-editor/lib/formationEditorMappers";
import { createRegeneratedFormations } from "@/features/formation-editor/lib/regenerateFormationSlots";
import type { EditorQuarter } from "@/features/formation-editor/model/types";
import { getFormationTemplate } from "@/features/formation-template-manage/lib/formationTemplateQueries";
import type { FormationPlayer } from "@/features/match-create/lib/generateQuarterFormations";
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
