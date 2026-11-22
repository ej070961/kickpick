"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  replaceFormationSlots,
  updateMatchFormationLabel,
} from "@/features/formation-editor/api/mutations";
import { getFormationRegenerationContext } from "@/features/formation-editor/api/queries";
import {
  createFormationSlotRows,
  toInsertedEditorQuarters,
} from "@/features/formation-editor/api/mappers";
import { createRegeneratedFormations } from "@/features/formation-editor/lib/regenerateSlots";
import { regenerationSchema } from "@/features/formation-editor/model/schemas";
import type { EditorQuarter } from "@/features/formation-editor/model/types";
import { getFormationTemplate } from "@/entities/formation/api/formationTemplateQueries";

/**
 * 편집기에서 변경한 모든 쿼터 슬롯 배정을 저장합니다.
 */
export const regenerateMatchFormation = async (
  matchId: string,
  input: unknown,
): Promise<{
  formationLabel?: string;
  message: string;
  quarters?: EditorQuarter[];
  success?: boolean;
}> => {
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

  const contextResult = await getFormationRegenerationContext(
    matchIdResult.data,
  );

  if (!contextResult.ok) {
    return { message: contextResult.error };
  }

  const { match, participants, quarterFormations, preservedQuarters } =
    contextResult.context;
  const players = participants.map(({ player }) => player);
  const reducedPlayerIds = participants
    .filter((participant) => participant.isReducedQuota)
    .map(({ player }) => player.id);

  if (players.length < preset.slots.length) {
    return {
      message: `${preset.label} 포메이션은 최소 ${preset.slots.length}명이 필요합니다.`,
    };
  }

  const quarterFormationIdByNumber = new Map(
    quarterFormations.map((quarter) => [quarter.quarterNumber, quarter.id]),
  );
  const quarterNumberByFormationId = new Map(
    quarterFormations.map((quarter) => [quarter.id, quarter.quarterNumber]),
  );

  if (quarterFormations.length !== match.quarter_count) {
    return { message: "쿼터 포메이션 수가 경기 설정과 일치하지 않습니다." };
  }

  let generatedFormations;

  try {
    generatedFormations = createRegeneratedFormations({
      match: {
        gkFixed: match.gk_fixed,
        quarterCount: match.quarter_count,
      },
      mode,
      players,
      preset,
      quarters: preservedQuarters,
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
    playerTypeById: Object.fromEntries(
      players.map((player) => [player.id, player.type]),
    ),
  });
  const replaceResult = await replaceFormationSlots({
    quarterFormationIds: quarterFormations.map((quarter) => quarter.id),
    slotRows,
  });

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
    quarters: toInsertedEditorQuarters({
      quarterNumberByFormationId,
      rows: replaceResult.insertedSlots,
    }),
    success: true,
  };
};

/**
 * match id 기준 최신 쿼터 슬롯을 편집기 상태로 변환합니다.
 */
