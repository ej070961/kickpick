"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveFormationSlotsAtomically } from "@/features/formation-editor/api/mutations";
import { splitParticipantIdentity } from "@/features/formation-editor/api/mappers";
import { slotUpdateSchema } from "@/features/formation-editor/model/schemas";

export const saveFormationSlots = async (matchId: string, slots: unknown) => {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  const slotsResult = slotUpdateSchema.safeParse(slots);

  if (!matchIdResult.success || !slotsResult.success) {
    return { message: "저장할 포메이션 데이터가 올바르지 않습니다." };
  }

  const saveError = await saveFormationSlotsAtomically({
    matchId: matchIdResult.data,
    slots: slotsResult.data.map((slot) => {
      const participant =
        slot.playerId && slot.playerType
          ? { id: slot.playerId, type: slot.playerType }
          : null;
      const { guestPlayerId, playerId } = splitParticipantIdentity(participant);

      return {
        fit_score: slot.fitScore,
        guest_player_id: guestPlayerId,
        id: slot.id,
        is_manual: slot.isManual,
        player_id: playerId,
      };
    }),
  });

  if (saveError) return { message: saveError };

  revalidatePath(`/matches/${matchIdResult.data}`);

  return { message: "저장했습니다.", success: true };
};

/**
 * 팀 정식 선수를 현재 경기 참가 명단에 추가합니다.
 */
