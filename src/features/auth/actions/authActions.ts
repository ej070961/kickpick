"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { ensureDefaultTeamForUser } from "@/entities/team";
import { createClient } from "@/shared/api/supabase/server";

type SupportedOAuthProvider = Extract<Provider, "kakao" | "google">;

const SUPPORTED_OAUTH_PROVIDERS: SupportedOAuthProvider[] = ["kakao", "google"];
const OAUTH_PROVIDER_SCOPES = {
  kakao: "profile_nickname profile_image",
  google: undefined,
} satisfies Record<SupportedOAuthProvider, string | undefined>;

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
  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: origin ? `${origin}/auth/callback?next=/` : undefined,
      scopes: OAUTH_PROVIDER_SCOPES[provider],
    },
  });

  if (error || !data.url) {
    redirect("/auth/error");
  }

  redirect(data.url);
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
    await ensureDefaultTeamForUser(userId, "KickPick 체험 팀");
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
