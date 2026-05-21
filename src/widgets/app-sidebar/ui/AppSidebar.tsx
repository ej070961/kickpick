"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavigation } from "@/shared/config/navigation";

/**
 * 앱 전역 네비게이션 컴포넌트.
 *
 * - 데스크탑(lg 이상): 좌측 고정 사이드바로 렌더링되며 로고 + 메뉴 목록을 포함합니다.
 *
 * `usePathname`으로 현재 경로를 감지해 가장 구체적으로 일치하는 메뉴 항목을
 * 활성 상태로 표시합니다.
 */
export function AppSidebar() {
  const pathname = usePathname();

  // 현재 경로와 일치하거나 하위 경로인 항목 중 가장 구체적인 href를 활성으로 선택
  const activeHref = appNavigation
    .filter(
      (item) =>
        pathname === item.href || pathname.startsWith(item.href + "/"),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const isActive = (href: string) => href === activeHref;

  return (
      <aside className="hidden min-h-dvh w-64 shrink-0 border-r border-white/80 bg-white/70 px-5 py-6 shadow-sm backdrop-blur-xl lg:block">
        <Link href="/" className="mb-8 block">
          <Image
            src="/images/logo.png"
            alt="KickPick"
            width={160}
            height={33}
            priority
          />
        </Link>
        <nav className="space-y-1">
          {appNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
                  active
                    ? "bg-foreground text-white shadow-sm"
                    : "text-muted hover:bg-white hover:text-foreground hover:shadow-sm"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
  );
}
