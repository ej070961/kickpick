import type { ReactNode } from "react";

type EmptyStatePanelProps = {
  action?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
};

/**
 * 페이지나 목록 영역에 콘텐츠가 없을 때 공통 아이콘, 안내 문구, 선택 액션을 표시합니다.
 * 아이콘과 도메인별 문구, 이동 동작은 사용하는 화면에서 전달합니다.
 */
export function EmptyStatePanel({
  action,
  description,
  icon,
  title,
}: EmptyStatePanelProps) {
  return (
    <section className="border-border bg-card rounded-2xl border border-dashed px-6 py-10 text-center shadow-sm">
      <span
        aria-hidden="true"
        className="bg-mint-surface text-primary mx-auto flex size-12 items-center justify-center rounded-full"
      >
        {icon}
      </span>
      <h2 className="text-foreground mt-4 text-base font-bold">{title}</h2>
      <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-6">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
