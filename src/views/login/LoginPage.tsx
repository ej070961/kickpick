import { LoginForm } from "@/features/auth/ui/LoginForm";

export function LoginPage() {
  return (
    <main className="bg-background grid min-h-dvh place-items-center px-4">
      <section className="bg-card w-full max-w-sm rounded-2xl border border-white p-7 shadow-md">
        <p className="text-primary text-sm font-semibold">KickPick</p>
        <h1 className="text-foreground mt-3 text-3xl font-bold">로그인</h1>
        <p className="text-muted mt-3 text-sm leading-6">
          SNS 계정으로 빠르게 시작하거나, 가입 없이 바로 경기 배치를
          체험해보세요.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
