"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/api/supabase/server";

const playerIdsSchema = z.array(z.string().uuid()).min(1);

export async function updatePlayerPriorities(playerIds: string[]) {
  const validatedFields = playerIdsSchema.safeParse(playerIds);

  if (!validatedFields.success) return;

  const supabase = await createClient();

  await Promise.all(
    validatedFields.data.map((id, index) =>
      supabase
        .from("players")
        .update({ priority_rank: index + 1 })
        .eq("id", id)
        .eq("is_deleted", false),
    ),
  );

  revalidatePath("/players");
  revalidatePath("/players/priority");
}
