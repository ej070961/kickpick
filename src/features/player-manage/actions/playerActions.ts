"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { POSITION_CODES, type PositionCode } from "@/entities/position";
import { createClient } from "@/shared/api/supabase/server";

export type PlayerFormState = {
  errors?: {
    mainPosition?: string[];
    name?: string[];
    subPositions?: string[];
  };
  message?: string;
  success?: boolean;
};

const initialPlayerSchema = z.object({
  name: z.string().min(1, "선수 이름을 입력해주세요.").trim(),
  mainPosition: z
    .string()
    .refine(isPositionCode, "주 포지션을 선택해주세요."),
  subPositions: z.array(z.string()).default([]),
});

const updatePlayerSchema = initialPlayerSchema.extend({
  id: z.string().uuid("선수 ID가 올바르지 않습니다."),
});

function isPositionCode(value: string): value is PositionCode {
  return POSITION_CODES.includes(value as PositionCode);
}

function parseSubPositions(formData: FormData, mainPosition: string) {
  return formData
    .getAll("subPositions")
    .map(String)
    .filter((position): position is PositionCode => isPositionCode(position))
    .filter((position) => position !== mainPosition);
}

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return user.id;
}

async function getCurrentTeamId() {
  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const { data: team, error } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (team) return team.id as string;

  const { data: createdTeam, error: createError } = await supabase
    .from("teams")
    .insert({ name: "KickPick 팀", owner_user_id: userId })
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return createdTeam.id as string;
}

export async function createPlayer(
  _state: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const rawMainPosition = String(formData.get("mainPosition") ?? "");
  const validatedFields = initialPlayerSchema.safeParse({
    name: formData.get("name"),
    mainPosition: rawMainPosition,
    subPositions: parseSubPositions(formData, rawMainPosition),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const teamId = await getCurrentTeamId();
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
    mainPosition: rawMainPosition,
    subPositions: parseSubPositions(formData, rawMainPosition),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { id, mainPosition, name, subPositions } = validatedFields.data;

  const { error } = await supabase
    .from("players")
    .update({
      name,
      main_position: mainPosition,
      sub_positions: subPositions,
    })
    .eq("id", id)
    .eq("is_deleted", false);

  if (error) {
    return { message: "저장하지 못했습니다." };
  }

  revalidatePath("/players");
  revalidatePath("/players/priority");
  refresh();

  return { message: "저장했습니다.", success: true };
}

export async function deletePlayer(formData: FormData) {
  const playerId = z.string().uuid().safeParse(formData.get("id"));

  if (!playerId.success) return;

  const supabase = await createClient();
  await supabase
    .from("players")
    .update({ is_deleted: true })
    .eq("id", playerId.data);

  revalidatePath("/players");
  revalidatePath("/players/priority");
  refresh();
}
