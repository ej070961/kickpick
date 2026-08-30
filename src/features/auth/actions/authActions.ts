"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { createStarterFormationTemplates } from "@/entities/formation/api/createStarterFormationTemplates";
import { ensureDefaultTeamForUser } from "@/entities/team";
import { createClient } from "@/shared/api/supabase/server";

type SupportedOAuthProvider = Extract<Provider, "kakao" | "google">;

const SUPPORTED_OAUTH_PROVIDERS: SupportedOAuthProvider[] = ["kakao", "google"];
const KAKAO_AUTH_STATE_COOKIE = "kickpick-kakao-oauth-state";
const KAKAO_AUTH_NONCE_COOKIE = "kickpick-kakao-oauth-nonce";
const KAKAO_OIDC_SCOPES = "openid,profile_nickname,profile_image";

async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : undefined;
}

function isSupportedOAuthProvider(
  provider: FormDataEntryValue | null,
): provider is SupportedOAuthProvider {
  return (
    typeof provider === "string" &&
    SUPPORTED_OAUTH_PROVIDERS.includes(provider as SupportedOAuthProvider)
  );
}

async function startOAuthSignIn(
  provider: SupportedOAuthProvider,
): Promise<void> {
  if (provider === "kakao") {
    return startKakaoOidcSignIn();
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: origin ? `${origin}/auth/callback?next=/` : undefined,
    },
  });

  if (error || !data.url) {
    redirect("/auth/error");
  }

  redirect(data.url);
}

async function startKakaoOidcSignIn(): Promise<void> {
  const clientId = process.env.KAKAO_REST_API_KEY;
  const origin = await getRequestOrigin();

  if (!clientId || !origin) {
    redirect("/auth/error");
  }

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const hashedNonce = await createSha256HexDigest(nonce);
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  cookieStore.set(KAKAO_AUTH_STATE_COOKIE, state, cookieOptions);
  cookieStore.set(KAKAO_AUTH_NONCE_COOKIE, nonce, cookieOptions);

  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", `${origin}/auth/kakao/callback`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", KAKAO_OIDC_SCOPES);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("nonce", hashedNonce);

  redirect(authorizeUrl.toString());
}

async function createSha256HexDigest(value: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * OAuth 로그인의 단일 Server Action 진입점입니다.
 * provider 값은 UI에서 오지만 서버 allow-list로 다시 검증해 인증 정책을 서버에 둡니다.
 */
export async function signInWithOAuth(formData: FormData): Promise<void> {
  const provider = formData.get("provider");

  if (!isSupportedOAuthProvider(provider)) {
    redirect("/auth/error");
  }

  await startOAuthSignIn(provider);
}

/**
 * 계정 연결 전 체험 사용자를 시작합니다.
 * 완전한 비로그인이 아니라 Supabase 익명 사용자와 기본 팀을 만들어 기존 RLS/팀 소유권 모델을 유지합니다.
 */
export async function signInAnonymously(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  const userId = data.user?.id;

  if (error || !userId) {
    redirect("/auth/error");
  }

  try {
    await ensureDefaultTeamForUser(userId, "KickPick 체험 팀", {
      onCreatedTeam: createStarterFormationTemplates,
    });
  } catch {
    redirect("/auth/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * 현재 Supabase 세션을 종료하고 보호 라우트 접근을 다시 로그인 화면으로 돌립니다.
 * 로그아웃 후 layout cache를 무효화해 서버 컴포넌트가 이전 세션을 재사용하지 않게 합니다.
 */
export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
