import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createStarterFormationTemplates } from "@/entities/formation/api/createStarterFormationTemplates";
import { ensureDefaultTeamForUser } from "@/entities/team";
import { createClient } from "@/shared/api/supabase/server";

const KAKAO_AUTH_STATE_COOKIE = "kickpick-kakao-oauth-state";
const KAKAO_AUTH_NONCE_COOKIE = "kickpick-kakao-oauth-nonce";

type KakaoTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  id_token?: string;
};

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(KAKAO_AUTH_STATE_COOKIE)?.value;
  const nonce = cookieStore.get(KAKAO_AUTH_NONCE_COOKIE)?.value;

  cookieStore.delete(KAKAO_AUTH_STATE_COOKIE);
  cookieStore.delete(KAKAO_AUTH_NONCE_COOKIE);

  if (!code) {
    return redirectToAuthError(origin);
  }

  if (!state || !expectedState || state !== expectedState || !nonce) {
    return redirectToAuthError(origin);
  }

  const clientId = process.env.KAKAO_REST_API_KEY;

  if (!clientId) {
    return redirectToAuthError(origin);
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: `${origin}/auth/kakao/callback`,
    code,
  });

  if (process.env.KAKAO_CLIENT_SECRET) {
    tokenBody.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  }

  const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: tokenBody,
  });

  const tokenPayload = (await tokenResponse.json()) as KakaoTokenResponse;

  if (!tokenResponse.ok || !tokenPayload.id_token) {
    return redirectToAuthError(origin);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "kakao",
    token: tokenPayload.id_token,
    access_token: tokenPayload.access_token,
    nonce,
  });

  if (error) {
    return redirectToAuthError(origin);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const displayName =
      user.user_metadata.full_name ??
      user.user_metadata.name ??
      user.email ??
      "KickPick";

    await ensureDefaultTeamForUser(user.id, `${displayName} 팀`, {
      onCreatedTeam: createStarterFormationTemplates,
    });
  }

  return NextResponse.redirect(`${origin}/`);
}

function redirectToAuthError(origin: string) {
  return NextResponse.redirect(`${origin}/auth/error`);
}
