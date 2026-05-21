"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/shared/api/supabase/server";

export type AuthFormState = {
  errors?: {
    email?: string[];
    password?: string[];
    teamName?: string[];
  };
  message?: string;
  success?: boolean;
};

const signInSchema = z.object({
  email: z.email("이메일 형식이 올바르지 않습니다.").trim(),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
});

const signUpSchema = signInSchema.extend({
  teamName: z.string().min(1, "팀 이름을 입력해주세요.").trim(),
});

function getAuthErrorMessage(error: AuthError) {
  const message = error.message.toLowerCase();

  if (
    error.code === "over_email_send_rate_limit" ||
    error.status === 429 ||
    message.includes("rate limit")
  ) {
    return "인증 메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  }

  if (
    error.code === "email_address_invalid" ||
    message.includes("email address") ||
    message.includes("invalid")
  ) {
    return "Supabase Auth에서 이 이메일 주소를 허용하지 않았습니다. 다른 실제 이메일을 사용하거나 Auth 설정의 이메일 제한을 확인해주세요.";
  }

  if (error.code === "user_already_exists") {
    return "이미 가입된 이메일입니다. 로그인해주세요.";
  }

  if (error.code === "weak_password") {
    return "비밀번호가 Supabase 비밀번호 정책을 만족하지 않습니다.";
  }

  return "회원가입을 완료하지 못했습니다. 입력값을 확인해주세요.";
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : undefined;
}

export async function createTeamIfMissing(
  teamName: string,
  ownerUserId: string,
) {
  const supabase = await createClient();
  const { data: existingTeam, error: selectError } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (selectError) return selectError;
  if (existingTeam) return null;

  const { error } = await supabase.from("teams").insert({
    name: teamName,
    owner_user_id: ownerUserId,
  });

  return error;
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: origin
        ? `${origin}/auth/callback?next=/`
        : undefined,
    },
  });

  if (error || !data.url) {
    redirect("/auth/error");
  }

  redirect(data.url);
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(
    validatedFields.data,
  );

  if (error) {
    return { message: "이메일 또는 비밀번호를 확인해주세요." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    teamName: formData.get("teamName"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password, teamName } = validatedFields.data;
  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { team_name: teamName },
      emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined,
    },
  });

  if (error) {
    return { message: getAuthErrorMessage(error) };
  }

  if (!data.session || !data.user) {
    return {
      message: "인증 메일을 확인한 뒤 로그인해주세요.",
      success: true,
    };
  }

  const teamError = await createTeamIfMissing(teamName, data.user.id);

  if (teamError) {
    return { message: "팀 생성 중 오류가 발생했습니다." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
