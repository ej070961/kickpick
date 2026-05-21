import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <section className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-mismatch">인증 실패</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          로그인 링크를 확인해주세요
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          링크가 만료되었거나 이미 사용된 인증 요청입니다.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          로그인으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
