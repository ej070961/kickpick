"use server";

import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/api/supabase/server";

export async function deleteMatch(formData: FormData) {
  const matchId = z.string().uuid().safeParse(formData.get("id"));

  if (!matchId.success) return;

  const supabase = await createClient();
  await supabase.from("matches").delete().eq("id", matchId.data);

  revalidatePath("/");
  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId.data}`);
  refresh();
}
