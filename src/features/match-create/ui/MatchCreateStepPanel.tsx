import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  description: string;
  title: string;
};

/**
 * 경기 생성 wizard의 각 단계 본문을 감싸는 공통 패널이다.
 *
 * 단계별 제목, 설명, 본문 간격, 최소 높이를 한 곳에서 맞춰 화면 밀도와 정렬이
 * 단계마다 달라지지 않게 한다.
 */
export function MatchCreateStepPanel({
  children,
  className = "",
  contentClassName = "mt-5",
  description,
  title,
}: Props) {
  return (
    <section
      className={`border-border bg-card rounded-lg border p-4 shadow-sm lg:min-h-[25rem] ${className}`}
    >
      <div>
        <h3 className="text-foreground text-base font-semibold">{title}</h3>
        <p className="text-muted mt-1 text-sm leading-6">{description}</p>
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
