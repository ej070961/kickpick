"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveGuest } from "@/features/formation-editor/api/guestMutations";
import { guestPlayerSchema } from "@/features/formation-editor/model/schemas";
import type { GuestPlayerFormInput } from "@/features/formation-editor/model/types";

/** 경기 전용 게스트를 추가하거나 정보를 수정합니다. */
export const saveMatchGuestPlayer = async (matchId: string, input: unknown) => {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  const inputResult = guestPlayerSchema.safeParse(input);

  if (!matchIdResult.success || !inputResult.success) {
    return { message: "게스트 정보가 올바르지 않습니다." };
  }

  const guest = normalizeGuestInput(inputResult.data);
  const result = await saveGuest({ guest, matchId: matchIdResult.data });
  if (!result.success) return result;

  revalidatePath(`/matches/${matchIdResult.data}`);
  return result;
};

/** 주 포지션과 중복되는 부 포지션을 제거합니다. */
const normalizeGuestInput = (
  input: z.infer<typeof guestPlayerSchema>,
): GuestPlayerFormInput => {
  return {
    ...input,
    name: input.name.trim(),
    subPositions: [...new Set(input.subPositions)].filter(
      (position) => position !== input.mainPosition,
    ),
  };
};
