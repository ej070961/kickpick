import { GalleryVerticalEnd } from "lucide-react";
import { EmptyStatePanel } from "@/shared/ui";

/**
 * 저장된 포메이션 템플릿이 없을 때 목록 영역에 보여주는 빈 상태입니다.
 */
export function EmptyState() {
  return (
    <EmptyStatePanel
      icon={<GalleryVerticalEnd size={22} />}
      title="저장된 포메이션이 없어요"
      description="새 포메이션을 추가하면 경기 만들기에서 바로 선택할 수 있어요."
    />
  );
}
