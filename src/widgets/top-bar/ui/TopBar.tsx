import Image from "next/image";
import Link from "next/link";
import { LogOut, PlusCircle } from "lucide-react";
import { signOut } from "@/features/auth/actions/authActions";

export function TopBar() {
  return (
    <header className="bg-background/75 sticky top-0 z-20 border-b border-white/70 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
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
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/matches/new"
            className="bg-primary text-primary-foreground inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold shadow-sm transition hover:brightness-95 sm:px-4"
            aria-label="새 경기"
          >
            <PlusCircle size={18} aria-hidden="true" />
            <span className="hidden sm:inline">새 경기</span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-muted hover:text-foreground inline-flex size-11 items-center justify-center rounded-xl border border-white bg-white/85 shadow-sm transition"
              aria-label="로그아웃"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
