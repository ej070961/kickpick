"use server";

import { z } from "zod";
import { getMatchPlayerCandidates } from "@/features/formation-editor/api/queries";

/** 경기 참가자로 등록할 수 있는 활성 팀 선수 후보를 조회합니다. */
export const loadMatchPlayerCandidates = async (matchId: string) => {
  const matchIdResult = z.string().uuid().safeParse(matchId);
  if (!matchIdResult.success)
    throw new Error("경기 정보를 확인할 수 없습니다.");

  return getMatchPlayerCandidates(matchIdResult.data);
};
