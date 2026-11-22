import Link from "next/link";

/** 랜딩 하단에서 로그인으로 이어지는 마무리 CTA입니다. */
export function LandingCallToAction() {
  return (
    <section className="px-5 pb-20 sm:px-8 sm:pb-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-3xl bg-[#172b25] px-7 py-10 text-center text-white sm:px-12 sm:py-12 md:flex-row md:text-left">
        <div>
          <p className="text-sm font-semibold text-emerald-300">
            경기 전 준비를 간단하게
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">
            다음 경기 라인업을 준비해 보세요.
          </h2>
        </div>
        <Link
          href="/login"
          className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 font-bold text-[#172b25] transition hover:bg-emerald-100"
        >
          KickPick 시작하기
        </Link>
      </div>
    </section>
  );
}
