"use server";

import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";
import {
  PLAYER_POSITION_CODES,
  type PlayerPositionCode,
} from "@/entities/position";
import { ensureCurrentTeamId, requireCurrentTeamId } from "@/entities/team";
import { createClient } from "@/shared/api/supabase/server";

export type PlayerFormState = {
  errors?: {
    mainPosition?: string[];
    name?: string[];
    playerNumber?: string[];
    subPositions?: string[];
  };
  message?: string;
  success?: boolean;
};

export type DeletePlayerState = {
  message?: string;
  success?: boolean;
};

const initialPlayerSchema = z.object({
  name: z.string().min(1, "선수 이름을 입력해주세요.").trim(),
  playerNumber: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .int("선수 번호는 정수여야 합니다.")
        .min(0, "선수 번호는 0 이상이어야 합니다.")
        .max(99, "선수 번호는 99 이하이어야 합니다."),
    ])
    .transform((value) => (value === "" ? null : value)),
  mainPosition: z
    .string()
    .refine(isPlayerPositionCode, "주 포지션을 선택해주세요."),
  subPositions: z.array(z.string()).default([]),
});

const updatePlayerSchema = initialPlayerSchema.extend({
  id: z.string().uuid("선수 ID가 올바르지 않습니다."),
});

function isPlayerPositionCode(value: string): value is PlayerPositionCode {
  return PLAYER_POSITION_CODES.includes(value as PlayerPositionCode);
}

function parseSubPositions(formData: FormData, mainPosition: string) {
  return formData
    .getAll("subPositions")
    .map(String)
    .filter((position): position is PlayerPositionCode =>
      isPlayerPositionCode(position),
    )
    .filter((position) => position !== mainPosition);
}

export async function createPlayer(
  _state: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const rawMainPosition = String(formData.get("mainPosition") ?? "");
  const validatedFields = initialPlayerSchema.safeParse({
    name: formData.get("name"),
    playerNumber: formData.get("playerNumber") ?? "",
    mainPosition: rawMainPosition,
    subPositions: parseSubPositions(formData, rawMainPosition),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const teamId = await ensureCurrentTeamId();
  const { data: latestPlayer, error: latestError } = await supabase
    .from("players")
    .select("priority_rank")
    .eq("team_id", teamId)
    .eq("is_deleted", false)
    .order("priority_rank", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return { message: "우선순위를 계산하지 못했습니다." };
  }

  const priorityRank =
    typeof latestPlayer?.priority_rank === "number"
      ? latestPlayer.priority_rank + 1
      : 1;
  const { error } = await supabase.from("players").insert({
    team_id: teamId,
    name: validatedFields.data.name,
    player_number: validatedFields.data.playerNumber,
    main_position: validatedFields.data.mainPosition,
    sub_positions: validatedFields.data.subPositions,
    priority_rank: priorityRank,
  });

  if (error) {
    return { message: "선수를 추가하지 못했습니다." };
  }

  revalidatePath("/players");
  revalidatePath("/players/priority");
  refresh();

  return { message: "선수를 추가했습니다.", success: true };
}

export async function updatePlayer(
  _state: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const rawMainPosition = String(formData.get("mainPosition") ?? "");
  const validatedFields = updatePlayerSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    playerNumber: formData.get("playerNumber") ?? "",
    mainPosition: rawMainPosition,
    subPositions: parseSubPositions(formData, rawMainPosition),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const teamId = await requireCurrentTeamId();
  const { id, mainPosition, name, playerNumber, subPositions } =
    validatedFields.data;

  const { error } = await supabase
    .from("players")
    .update({
      name,
      player_number: playerNumber,
      main_position: mainPosition,
      sub_positions: subPositions,
    })
    .eq("id", id)
    .eq("team_id", teamId)
    .eq("is_deleted", false);

  if (error) {
    return { message: "저장하지 못했습니다." };
  }

  revalidatePath("/players");
  revalidatePath("/players/priority");
  refresh();

  return { message: "저장했습니다.", success: true };
}

export async function deletePlayer(
  _state: DeletePlayerState,
  formData: FormData,
): Promise<DeletePlayerState> {
  const playerId = z.string().uuid().safeParse(formData.get("id"));

  if (!playerId.success) {
    return { message: "선수 정보를 확인하지 못했습니다." };
  }

  const supabase = await createClient();
  const teamId = await requireCurrentTeamId();
  const { error } = await supabase
    .from("players")
    .update({ is_deleted: true })
    .eq("id", playerId.data)
    .eq("team_id", teamId);

  if (error) {
    return { message: "선수를 삭제하지 못했습니다." };
  }

  revalidatePath("/players");
  revalidatePath("/players/priority");
  refresh();

  return { message: "선수를 명단에서 삭제했습니다.", success: true };
}
