import type { MatchInfoPatch } from "@/features/match-create/model/matchDraft";
import { HelpTooltip } from "@/shared/ui";

type Props = {
  gkFixed: boolean;
  onChange: (patch: MatchInfoPatch) => void;
};

export function GkFixedField({ gkFixed, onChange }: Props) {
  return (
    <div className="border-border bg-background flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2 lg:mt-7">
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-foreground block text-sm font-semibold">
            골키퍼 고정
          </span>
          <HelpTooltip
            label="골키퍼 고정 안내"
            message="켜면 우선순위가 가장 높은 GK 한 명을 모든 쿼터의 골키퍼로 유지합니다."
          />
        </span>
        <span className="text-muted block truncate text-xs">
          {gkFixed ? "전 쿼터 유지" : "쿼터별 배분"}
        </span>
      </span>
      <label
        htmlFor="gk-fixed"
        className="shrink-0 cursor-pointer"
        aria-label="골키퍼 고정 여부"
      >
        <input
          id="gk-fixed"
          type="checkbox"
          checked={gkFixed}
          onChange={(event) => onChange({ gkFixed: event.target.checked })}
          className="peer sr-only"
        />
        <span
          className={`block h-6 w-11 rounded-full p-0.5 transition ${
            gkFixed ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`block size-5 rounded-full bg-white transition ${
              gkFixed ? "translate-x-5" : ""
            }`}
          />
        </span>
      </label>
    </div>
  );
}
