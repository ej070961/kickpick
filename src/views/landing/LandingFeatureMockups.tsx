import { ChevronDown, Copy, Download, GripVertical, Save } from "lucide-react";
import { Badge } from "@/shared/ui";
import {
  LandingFieldPreview,
  landingBenchPlayers,
  landingAssignmentSummary,
} from "./FormationPreview";

const quarterNumbers = [1, 2, 3, 4];

/** 실제 배정 데이터를 반영한 선명한 HTML 요약 목업입니다. */
export function AssignmentSummaryMockup() {
  return (
    <section
      aria-label="선수별 쿼터 배정 요약 목업"
      className="border-border bg-card rounded-lg border p-4 shadow-sm"
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-foreground text-base font-semibold">
            전체 배정 요약
          </h4>
          <p className="text-muted mt-1 text-sm">
            전체 쿼터 기준 선수별 출전 쿼터입니다.
          </p>
        </div>
        <span className="text-primary inline-flex min-h-10 shrink-0 items-center gap-2 px-2 text-sm font-semibold">
          4쿼터 · 13명
          <ChevronDown aria-hidden="true" className="rotate-180" size={16} />
        </span>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {landingAssignmentSummary.map((player) => (
          <li
            key={player.id}
            className="border-border bg-background flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
          >
            <span className="text-foreground min-w-0 truncate font-semibold">
              {player.displayName}
            </span>
            <span className="flex shrink-0 flex-wrap justify-end gap-1">
              {player.quarterNumbers.map((quarterNumber) => (
                <Badge key={quarterNumber} variant="primary">
                  {quarterNumber}Q
                </Badge>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 실제 경기 편집기에서 선수 배치와 후보를 조정하는 영역을 재현합니다. */
export function FormationEditorMockup() {
  return (
    <div
      aria-label="편집기 조작 영역 목업"
      className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_370px]"
    >
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <QuarterFormationsMockup />
        <LandingFieldPreview className="max-w-md" />
      </div>

      <aside className="space-y-3">
        <BenchPlayersMockup />
        <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
          <ShareActionsMockup />
        </div>
      </aside>
    </div>
  );
}

function QuarterFormationsMockup() {
  return (
    <section
      aria-label="쿼터별 포메이션 목업"
      className="border-border bg-card min-w-0 self-start rounded-xl border p-4 shadow-sm"
    >
      <h5 className="text-foreground mb-1 text-sm font-bold">
        쿼터별 포메이션
      </h5>
      <p className="text-muted mb-3 text-xs">
        쿼터를 눌러 선택하고, 핸들을 끌어 배치를 맞바꾸세요.
      </p>
      <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-2">
        <ol className="grid content-start gap-2" aria-label="쿼터 선택">
          {quarterNumbers.map((quarterNumber) => (
            <li
              key={quarterNumber}
              className={`flex min-h-[46px] items-center justify-center rounded-lg border text-sm font-semibold ${quarterNumber === 1 ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background text-foreground"}`}
            >
              {quarterNumber}Q
            </li>
          ))}
        </ol>
        <ol className="grid min-w-0 content-start gap-2" aria-label="쿼터 배치">
          {quarterNumbers.map((quarterNumber) => (
            <li
              key={quarterNumber}
              className="border-border bg-background flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-1.5"
            >
              <span className="text-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                <GripVertical aria-hidden="true" size={17} />
              </span>
              <span className="sr-only">{quarterNumber}Q 배치</span>
              <span className="text-muted ml-auto flex size-8 shrink-0 items-center justify-center rounded-md">
                <Copy aria-hidden="true" size={15} />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function BenchPlayersMockup() {
  return (
    <section className="border-border bg-card rounded-lg border p-4 shadow-sm">
      <h5 className="text-foreground text-base font-semibold">
        현재 쿼터 후보
      </h5>
      <p className="text-muted mt-1 text-sm">1Q · 출전 11명 · 후보 2명</p>
      <p className="text-muted mt-2 text-xs">
        유니폼 또는 후보 카드를 먼저 선택하세요.
      </p>
      <ul className="mt-3 space-y-2">
        {landingBenchPlayers.map((player) => (
          <li
            key={player.id}
            className="border-border flex min-h-10 items-center justify-between gap-3 rounded-lg border px-3 text-sm"
          >
            <span className="text-foreground min-w-0 truncate font-semibold">
              {player.displayName}
            </span>
            <Badge>{player.position}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 실제 편집기의 저장·공유 액션 스타일을 반영한 HTML 목업입니다. */
export function ShareActionsMockup() {
  return (
    <div aria-label="배치 저장 및 공유 목업" className="grid gap-2">
      <div className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold">
        <Save aria-hidden="true" size={18} />
        저장
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="border-border text-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold">
          <Copy aria-hidden="true" size={17} />
          이미지 복사
        </div>
        <div className="border-border text-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold">
          <Download aria-hidden="true" size={17} />한 번에 받기
        </div>
      </div>
    </div>
  );
}
