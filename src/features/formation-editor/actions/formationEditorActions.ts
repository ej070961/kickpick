"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/api/supabase/server";

const slotUpdateSchema = z.array(
  z.object({
    fitScore: z.number().int().min(0).max(10).nullable(),
    id: z.string().uuid(),
    isManual: z.boolean(),
    playerId: z.string().uuid().nullable(),
  }),
);

export async function saveFormationSlots(matchId: string, slots: unknown) {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  const slotsResult = slotUpdateSchema.safeParse(slots);

  if (!matchIdResult.success || !slotsResult.success) {
    return { message: "저장할 포메이션 데이터가 올바르지 않습니다." };
  }

  const supabase = await createClient();
  const updates = await Promise.all(
    slotsResult.data.map((slot) =>
      supabase
        .from("formation_slots")
        .update({
          fit_score: slot.fitScore,
          is_manual: slot.isManual,
          player_id: slot.playerId,
        })
        .eq("id", slot.id),
    ),
  );
  const failed = updates.find(({ error }) => error);

  if (failed?.error) {
    return { message: "포메이션을 저장하지 못했습니다." };
  }

  revalidatePath(`/matches/${matchIdResult.data}`);

  return { message: "저장했습니다.", success: true };
}
