import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createTeamIfMissing } from "@/features/auth/actions/authActions";
import { createClient } from "@/shared/api/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const teamName = user?.user_metadata.team_name;

      if (user && typeof teamName === "string" && teamName.trim()) {
        await createTeamIfMissing(teamName.trim(), user.id);
      }

      redirect(next);
    }
  }

  redirect("/auth/error");
}
