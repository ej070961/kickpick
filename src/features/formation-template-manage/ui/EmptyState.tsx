import { GalleryVerticalEnd } from "lucide-react";

/**
 * 저장된 포메이션 템플릿이 없을 때 목록 영역에 보여주는 빈 상태입니다.
 */
export function EmptyState() {
  return (
    <div className="border-border bg-card rounded-lg border border-dashed px-6 py-12 text-center shadow-sm">
      <span className="bg-mint-surface text-primary mx-auto flex size-12 items-center justify-center rounded-lg">
        <GalleryVerticalEnd size={22} aria-hidden="true" />
      </span>
      <h3 className="text-foreground mt-4 text-base font-bold">
        저장된 포메이션이 없습니다
      </h3>
      <p className="text-muted mx-auto mt-2 max-w-sm text-sm leading-6">
        새 포메이션을 추가하면 경기 만들기에서 바로 선택할 수 있어요.
      </p>
    </div>
  );
}
