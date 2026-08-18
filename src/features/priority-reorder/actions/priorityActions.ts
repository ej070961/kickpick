"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentTeamId } from "@/entities/team";
import { createClient } from "@/shared/api/supabase/server";

const playerIdsSchema = z.array(z.string().uuid()).min(1);

export type PriorityUpdateState = {
  message?: string;
  success: boolean;
};

export async function updatePlayerPriorities(
  playerIds: string[],
): Promise<PriorityUpdateState> {
  const validatedFields = playerIdsSchema.safeParse(playerIds);

  if (!validatedFields.success) {
    return {
      message: "저장할 선수 순서를 확인하지 못했습니다.",
      success: false,
    };
  }

  const supabase = await createClient();
  const teamId = await requireCurrentTeamId();
  const { data: activePlayers, error: activePlayersError } = await supabase
    .from("players")
    .select("id")
    .eq("team_id", teamId)
    .eq("is_deleted", false);

  if (activePlayersError) {
    return { message: "선수 목록을 확인하지 못했습니다.", success: false };
  }

  const activePlayerIds = new Set(
    (activePlayers ?? []).map((player) => player.id as string),
  );
  const uniquePlayerIds = new Set(validatedFields.data);

  if (
    uniquePlayerIds.size !== validatedFields.data.length ||
    uniquePlayerIds.size !== activePlayerIds.size ||
    validatedFields.data.some((id) => !activePlayerIds.has(id))
  ) {
    return {
      message:
        "현재 명단과 순서 정보가 맞지 않습니다. 새로고침 후 다시 시도해주세요.",
      success: false,
    };
  }

  const results = await Promise.all(
    validatedFields.data.map((id, index) =>
      supabase
        .from("players")
        .update({ priority_rank: index + 1 })
        .eq("id", id)
        .eq("team_id", teamId)
        .eq("is_deleted", false),
    ),
  );

  if (results.some((result) => result.error)) {
    return { message: "순서를 저장하지 못했습니다.", success: false };
  }

  revalidatePath("/players");
  revalidatePath("/players/priority");

  return { message: "순서를 저장했습니다.", success: true };
}
