"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addRegisteredPlayer,
  removeParticipant,
} from "@/features/formation-editor/api/participantMutations";
import { participantIdentitySchema } from "@/features/formation-editor/model/schemas";
import type {
  EditorQuarter,
  AvailablePlayer,
} from "@/features/formation-editor/model/types";
import type { ParticipantIdentity } from "@/entities/match";

/** 등록 선수를 현재 경기 참가 명단에 추가합니다. */
export const addRegisteredPlayerToMatch = async (
  matchId: string,
  playerId: string,
): Promise<{
  message: string;
  player?: AvailablePlayer;
  success?: boolean;
}> => {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  const playerIdResult = z.string().uuid().safeParse(playerId);

  if (!matchIdResult.success || !playerIdResult.success) {
    return { message: "추가할 선수 정보가 올바르지 않습니다." };
  }

  const result = await addRegisteredPlayer({
    matchId: matchIdResult.data,
    playerId: playerIdResult.data,
  });
  if (!result.success) return { message: result.message };

  revalidatePath(`/matches/${matchIdResult.data}`);
  return { ...result, success: true };
};

/** 경기 참가자를 명단에서 제거하고 최신 쿼터 배정을 반환합니다. */
export const removeMatchParticipant = async (
  matchId: string,
  participant: ParticipantIdentity,
): Promise<{
  message: string;
  quarters?: EditorQuarter[];
  success?: boolean;
}> => {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  const participantResult = participantIdentitySchema.safeParse(participant);

  if (!matchIdResult.success || !participantResult.success) {
    return { message: "제거할 선수 정보가 올바르지 않습니다." };
  }

  const result = await removeParticipant({
    matchId: matchIdResult.data,
    participant: participantResult.data,
  });
  if (!result.ok) return { message: result.message };

  revalidatePath(`/matches/${matchIdResult.data}`);
  return { message: result.message, quarters: result.quarters, success: true };
};
