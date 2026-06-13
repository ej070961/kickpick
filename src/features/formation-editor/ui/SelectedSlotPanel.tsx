import type {
  EditorPlayer,
  EditorSlot,
} from "@/features/formation-editor/model/types";
import { formatPlayerName } from "@/features/formation-editor/lib/formationEditorFormat";

type SelectedSlotPanelProps = {
  selectedPlayer: EditorPlayer | undefined;
  selectedSlot: EditorSlot | undefined;
};

/**
 * 현재 선택된 슬롯과 배정 선수를 보여주고 다음 교체 행동을 안내합니다.
 */
export function SelectedSlotPanel({
  selectedPlayer,
  selectedSlot,
}: SelectedSlotPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">현재 선택</h3>
      {selectedSlot ? (
        <div className="mt-3 rounded-lg border border-primary bg-mint-surface px-3 py-2">
          <p className="text-sm font-bold text-foreground">
            {selectedSlot.name}
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectedPlayer ? formatPlayerName(selectedPlayer) : "미배정"}
          </p>
          {selectedPlayer?.isGuest ? (
            <span className="mt-2 inline-flex rounded-md border border-primary/35 bg-card px-1.5 py-0.5 text-[10px] font-bold text-primary">
              용병
            </span>
          ) : null}
          <p className="mt-2 text-xs text-muted">
            다른 유니폼 또는 후보 카드를 누르면 교체됩니다.
          </p>
        </div>
      ) : (
        <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted">
          유니폼을 선택하면 교체할 수 있습니다.
        </p>
      )}
    </div>
  );
}
