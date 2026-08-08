import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="bg-background grid min-h-dvh place-items-center px-4">
      <section className="border-border bg-card w-full max-w-sm rounded-lg border p-6 text-center shadow-sm">
        <p className="text-mismatch text-sm font-semibold">인증 실패</p>
        <h1 className="text-foreground mt-2 text-2xl font-bold">
          로그인 링크를 확인해주세요
        </h1>
        <p className="text-muted mt-2 text-sm leading-6">
          링크가 만료되었거나 이미 사용된 인증 요청입니다.
        </p>
        <Link
          href="/login"
          className="bg-primary text-primary-foreground mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold"
        >
          로그인으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
