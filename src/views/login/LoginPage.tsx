import { LoginForm } from "@/features/auth/ui/LoginForm";

export function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <section className="w-full max-w-sm rounded-2xl border border-white bg-card p-7 shadow-md">
        <p className="text-sm font-semibold text-primary">KickPick</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">로그인</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          팀 단위 계정으로 선수 명단과 경기 배치를 관리합니다.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
