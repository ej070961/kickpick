import type { ReactNode } from "react";

type PageLayoutProps = {
  children: ReactNode;
};

/** 페이지 헤더와 본문을 일정한 세로 간격으로 배치합니다. */
export function PageLayout({ children }: PageLayoutProps) {
  return <div className="flex flex-col gap-8">{children}</div>;
}
