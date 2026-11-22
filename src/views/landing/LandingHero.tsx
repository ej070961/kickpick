import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingFieldPreview } from "./FormationPreview";

/** 핵심 가치 제안과 실제 편집 화면, 로그인 진입 버튼을 보여줍니다. */
export function LandingHero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-5 pt-14 pb-14 sm:px-8 sm:pt-20 sm:pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-6">
      <div className="max-w-2xl">
        <p className="text-primary text-sm font-semibold">
          쿼터별 라인업, 더 쉽게
        </p>
        <h1 className="text-foreground mt-4 text-4xl leading-tight font-bold tracking-normal sm:text-5xl lg:text-[3.5rem]">
          참가 선수에 맞춰
          <br />
          쿼터별 라인업을 자동 배치
        </h1>
        <p className="text-muted mt-5 max-w-xl text-base leading-7">
          출전 횟수와 포지션을 고려해 배치 초안을 만들고, 편집기에서 원하는
          부분만 빠르게 조정해 팀원들과 공유하세요.
        </p>
        <div className="mt-7">
          <Link
            href="/login"
            className="bg-primary text-primary-foreground inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-bold transition hover:brightness-95"
          >
            KickPick 시작하기
            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      <LandingFieldPreview />
    </section>
  );
}
