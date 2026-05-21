"use client";

import { useActionState, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import {
  signIn,
  signInWithGoogle,
  signUp,
  type AuthFormState,
} from "@/features/auth/actions/authActions";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [signInState, signInAction, isSignInPending] = useActionState(
    signIn,
    initialState,
  );
  const [signUpState, signUpAction, isSignUpPending] = useActionState(
    signUp,
    initialState,
  );
  const state = mode === "signIn" ? signInState : signUpState;
  const isPending = mode === "signIn" ? isSignInPending : isSignUpPending;

  return (
    <div>
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-surface"
        >
          <span className="grid size-5 place-items-center rounded-full border border-border text-xs font-bold">
            G
          </span>
          Google로 계속하기
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted">또는</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
        <button
          type="button"
          className={`min-h-10 rounded-lg text-sm font-semibold ${
            mode === "signIn"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted"
          }`}
          onClick={() => setMode("signIn")}
        >
          로그인
        </button>
        <button
          type="button"
          className={`min-h-10 rounded-lg text-sm font-semibold ${
            mode === "signUp"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted"
          }`}
          onClick={() => setMode("signUp")}
        >
          회원가입
        </button>
      </div>

      <form
        action={mode === "signIn" ? signInAction : signUpAction}
        className="mt-5 space-y-4"
      >
        {mode === "signUp" ? (
          <label className="block">
            <span className="text-sm font-medium text-foreground">팀 이름</span>
            <input
              name="teamName"
              className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
              placeholder="KickPick FC"
            />
            {state.errors?.teamName ? (
              <span className="mt-1 block text-xs text-mismatch">
                {state.errors.teamName[0]}
              </span>
            ) : null}
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-foreground">이메일</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
            placeholder="team@example.com"
          />
          {state.errors?.email ? (
            <span className="mt-1 block text-xs text-mismatch">
              {state.errors.email[0]}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">비밀번호</span>
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "signIn" ? "current-password" : "new-password"
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
          />
          {state.errors?.password ? (
            <span className="mt-1 block text-xs text-mismatch">
              {state.errors.password[0]}
            </span>
          ) : null}
        </label>

        {state.message ? (
          <p
            className={`rounded-xl px-3 py-2 text-sm ${
              state.success
                ? "bg-mint-surface text-foreground"
                : "bg-orange-50 text-mismatch"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {mode === "signIn" ? (
            <LogIn size={18} aria-hidden="true" />
          ) : (
            <UserPlus size={18} aria-hidden="true" />
          )}
          {isPending
            ? "처리 중"
            : mode === "signIn"
              ? "로그인"
              : "계정 만들기"}
        </button>
      </form>
    </div>
  );
}
