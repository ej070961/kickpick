import type { ReactNode } from "react";
import type {
  EditorPlayer,
  EditorSlot,
} from "@/features/formation-editor/model/types";
import { PlayerDisplayName } from "./PlayerDisplayName";

type SelectedSlotPanelProps = {
  selectedBenchPlayer: EditorPlayer | undefined;
  selectedPlayer: EditorPlayer | undefined;
  selectedSlot: EditorSlot | undefined;
};

type SelectedItemCardProps = {
  description: string;
  subtitle: ReactNode;
  title: ReactNode;
};

/**
 * 현재 선택된 슬롯과 배정 선수를 보여주고 다음 교체 행동을 안내합니다.
 */
export function SelectedSlotPanel({
  selectedBenchPlayer,
  selectedPlayer,
  selectedSlot,
}: SelectedSlotPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">현재 선택</h3>
      {selectedSlot ? (
        <SelectedItemCard
          description="다른 유니폼 또는 후보 카드를 누르면 교체됩니다."
          subtitle={
            selectedPlayer ? (
              <PlayerDisplayName player={selectedPlayer} />
            ) : (
              "미배정"
            )
          }
          title={selectedSlot.name}
        />
      ) : selectedBenchPlayer ? (
        <SelectedItemCard
          description="교체할 유니폼을 누르면 선택한 후보가 들어갑니다."
          subtitle={selectedBenchPlayer.mainPosition}
          title={<PlayerDisplayName player={selectedBenchPlayer} />}
        />
      ) : (
        <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted">
          유니폼 또는 후보 카드를 선택하면 교체할 수 있습니다.
        </p>
      )}
    </div>
  );
}

/**
 * 선택된 슬롯 또는 후보 선수의 요약 정보를 강조해서 표시합니다.
 */
function SelectedItemCard({
  description,
  subtitle,
  title,
}: SelectedItemCardProps) {
  return (
    <div className="mt-3 rounded-lg border border-primary bg-mint-surface px-3 py-2">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
      <p className="mt-2 text-xs text-muted">{description}</p>
    </div>
  );
}
