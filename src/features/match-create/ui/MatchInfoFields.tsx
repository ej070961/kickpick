import type { FormationTemplate } from "@/entities/formation";
import type { MatchCreateState } from "@/features/match-create/actions/matchCreateActions";

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
 * 경기명, 날짜, 쿼터 수, GK 고정, 포메이션을 입력하는 기본 정보 섹션입니다.
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
  return (
    <section className="border-border bg-card rounded-lg border p-4 shadow-sm">
      <h3 className="text-foreground text-base font-semibold">경기 정보</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block md:col-span-2">
          <span className="text-foreground text-sm font-medium">
            경기명
            <span className="text-muted ml-1 font-normal">(선택)</span>
          </span>
          <input
            name="name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="border-border focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
            placeholder="비워두면 이름 없이 생성됩니다"
          />
          {state.errors?.name ? (
            <span className="text-mismatch mt-1 block text-xs">
              {state.errors.name[0]}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-foreground text-sm font-medium">날짜</span>
          <input
            name="matchDate"
            type="date"
            value={matchDate}
            onChange={(event) => onMatchDateChange(event.target.value)}
            className="border-border focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
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

        <label className="block">
          <span className="text-foreground text-sm font-medium">포메이션</span>
          <select
            name="formation"
            value={formationKey}
            onChange={(event) => onFormationChange(event.target.value)}
            className="border-border bg-card focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
          >
            {formationTemplates.map((preset) => (
              <option key={preset.key} value={preset.key}>
                {preset.label}
              </option>
            ))}
          </select>
          {state.errors?.formation ? (
            <span className="text-mismatch mt-1 block text-xs">
              {state.errors.formation[0]}
            </span>
          ) : null}
        </label>

        <label className="border-border flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 md:mt-7">
          <span>
            <span className="text-foreground block text-sm font-semibold">
              GK 고정
            </span>
            <span className="text-muted block text-xs">
              {gkFixed ? "골키퍼를 모든 쿼터에 고정" : "쿼터별 자동 배치"}
            </span>
          </span>
          <input
            name="gkFixed"
            type="checkbox"
            checked={gkFixed}
            onChange={(event) => onGkFixedChange(event.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`h-6 w-11 rounded-full p-0.5 transition ${
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
    </section>
  );
}
