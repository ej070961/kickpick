import Image from "next/image";
import Link from "next/link";

/** 공개 랜딩의 브랜드와 로그인 진입점을 표시합니다. */
export function LandingHeader() {
  return (
    <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
      <Link href="/" className="min-w-0 shrink">
        <Image
          src="/images/logo.png"
          alt="KickPick"
          width={150}
          height={31}
          priority
          className="h-auto w-28 sm:w-32 lg:w-[150px]"
        />
      </Link>
      <Link
        href="/login"
        className="border-border hover:border-primary hover:text-primary rounded-full border bg-white px-5 py-2.5 text-sm font-bold transition"
      >
        로그인
      </Link>
    </header>
  );
}
