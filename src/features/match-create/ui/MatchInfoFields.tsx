import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import type { FormationTemplate } from "@/entities/formation";
import type { MatchCreateState } from "@/features/match-create/actions/matchCreateActions";
import { HelpTooltip } from "@/shared/ui";

type MatchInfoFieldsProps = {
  formationKey: string;
  formationTemplates: FormationTemplate[];
  gkFixed: boolean;
  matchDate: string;
  name: string;
  onFormationChange: (value: string) => void;
  onGkFixedChange: (value: boolean) => void;
  onMatchDateChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onQuarterCountChange: (value: number) => void;
  quarterCount: number;
  state: MatchCreateState;
};

/**
 * 경기명, 날짜, 쿼터 수, 골키퍼 전 쿼터 고정, 포메이션을 입력하는 기본 정보 섹션입니다.
 */
export function MatchInfoFields({
  formationKey,
  formationTemplates,
  gkFixed,
  matchDate,
  name,
  onFormationChange,
  onGkFixedChange,
  onMatchDateChange,
  onNameChange,
  onQuarterCountChange,
  quarterCount,
  state,
}: MatchInfoFieldsProps) {
  const defaultMatchName = useMemo(
    () => `${matchDate || "오늘"} 경기`,
    [matchDate],
  );

  function openDatePicker(input: HTMLInputElement) {
    try {
      input.showPicker?.();
    } catch {
      input.focus();
    }
  }

  return (
    <section className="border-border bg-card rounded-lg border p-4 shadow-sm">
      <h3 className="text-foreground text-base font-semibold">경기 정보</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="block md:col-span-2">
          <label
            htmlFor="match-name"
            className="text-foreground text-sm font-medium"
          >
            경기명
            <span className="text-muted ml-1 font-normal">(선택)</span>
          </label>
          <input
            id="match-name"
            name="name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="border-border focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
            placeholder={defaultMatchName}
          />
          {state.errors?.name ? (
            <span className="text-mismatch mt-1 block text-xs">
              {state.errors.name[0]}
            </span>
          ) : null}
        </div>

        <label className="block">
          <span className="text-foreground text-sm font-medium">날짜</span>
          <input
            name="matchDate"
            type="date"
            value={matchDate}
            onClick={(event) => openDatePicker(event.currentTarget)}
            onChange={(event) => onMatchDateChange(event.target.value)}
            className="border-border focus:border-primary mt-2 min-h-11 w-full cursor-pointer rounded-lg border px-3 text-sm transition outline-none"
          />
          {state.errors?.matchDate ? (
            <span className="text-mismatch mt-1 block text-xs">
              {state.errors.matchDate[0]}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-foreground text-sm font-medium">쿼터 수</span>
          <input
            name="quarterCount"
            type="number"
            min={1}
            max={8}
            value={quarterCount}
            onChange={(event) =>
              onQuarterCountChange(Number(event.target.value) || 1)
            }
            className="border-border focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
          />
          {state.errors?.quarterCount ? (
            <span className="text-mismatch mt-1 block text-xs">
              {state.errors.quarterCount[0]}
            </span>
          ) : null}
        </label>

        <div className="block">
          <label
            htmlFor="match-formation"
            className="text-foreground text-sm font-medium"
          >
            포메이션
          </label>
          <span className="relative mt-2 block">
            <select
              id="match-formation"
              name="formation"
              value={formationKey}
              onChange={(event) => onFormationChange(event.target.value)}
              className="border-border bg-card focus:border-primary min-h-11 w-full appearance-none rounded-lg border px-3 pr-10 text-sm transition outline-none"
            >
              {formationTemplates.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              aria-hidden="true"
              className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
            />
          </span>
          {state.errors?.formation ? (
            <span className="text-mismatch mt-1 block text-xs">
              {state.errors.formation[0]}
            </span>
          ) : null}
        </div>

        <div className="border-border bg-background flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2 md:mt-7">
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
              name="gkFixed"
              type="checkbox"
              checked={gkFixed}
              onChange={(event) => onGkFixedChange(event.target.checked)}
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
      </div>
    </section>
  );
}
