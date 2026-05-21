"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { CalendarPlus, Search, Users, X } from "lucide-react";
import type { Player } from "@/entities/player";
import { FORMATION_PRESETS } from "@/entities/formation";
import {
  createMatch,
  type MatchCreateState,
} from "@/features/match-create/actions/matchCreateActions";
import { SubmitButton } from "@/features/player-manage/ui/SubmitButton";

type MatchCreateFormProps = {
  players: Player[];
};

type MatchInfoFieldsProps = {
  formationKey: string;
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

type PlayerSelectionModalProps = {
  onSelectedPlayerIdsChange: (playerIds: Set<string>) => void;
  players: Player[];
  selectedPlayerIds: Set<string>;
};

type ReducedQuotaSelectorProps = {
  formationLabel: string;
  gkFixed: boolean;
  onQuotaPlayerIdsChange: (playerIds: Set<string>) => void;
  quarterCount: number;
  quotaPlayerIds: Set<string>;
  quotaSelectionType: QuotaSelectionType;
  requiredCount: number;
  selectedPlayers: Player[];
  slotsPerQuarter: number;
};

const initialState: MatchCreateState = {};
const STEP_ITEMS = [
  { label: "경기 설정", value: 1 },
  { label: "쿼터 배정", value: 2 },
];

type QuotaSelectionType = "increased" | "reduced";

/**
 * 경기 생성의 현재 단계를 표시합니다.
 */
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1">
      {STEP_ITEMS.map((item) => {
        const active = step === item.value;

        return (
          <div
            key={item.value}
            className={`rounded-xl px-4 py-3 text-center text-sm font-bold transition ${
              active ? "bg-card text-foreground shadow-sm" : "text-muted"
            }`}
          >
            <span className="mr-2 text-primary">{item.value}</span>
            {item.label}
          </div>
        );
      })}
    </div>
  );
}

function formatPositions(player: Player) {
  return [
    player.mainPosition,
    ...player.subPositions.filter((position) => position !== player.mainPosition),
  ].join(", ");
}

function PlayerPositionBadges({ player }: { player: Player }) {
  const subPositions = player.subPositions.filter(
    (position) => position !== player.mainPosition,
  );

  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-md border border-primary/35 bg-background px-2 py-1 text-xs font-semibold text-primary">
        <span className="text-[10px] font-bold text-muted">주</span>
        {player.mainPosition}
      </span>
      {subPositions.length > 0 ? (
        subPositions.map((position) => (
          <span
            key={position}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted"
          >
            <span className="text-[10px] font-bold text-muted">부</span>
            {position}
          </span>
        ))
      ) : (
        <span className="rounded-md border border-dashed border-border px-2 py-1 text-xs font-medium text-muted">
          부 포지션 없음
        </span>
      )}
    </span>
  );
}

function getQuotaSelectionType({
  playerCount,
  quarterCount,
  slotsPerQuarter,
}: {
  playerCount: number;
  quarterCount: number;
  slotsPerQuarter: number;
}): QuotaSelectionType {
  if (playerCount === 0) return "reduced";

  const remainder = (quarterCount * slotsPerQuarter) % playerCount;
  const reducedCount = remainder === 0 ? 0 : playerCount - remainder;

  return remainder > 0 && remainder <= reducedCount ? "increased" : "reduced";
}

function getQuotaSelectionCount({
  playerCount,
  quarterCount,
  slotsPerQuarter,
}: {
  playerCount: number;
  quarterCount: number;
  slotsPerQuarter: number;
}) {
  if (playerCount === 0) return 0;

  const remainder = (quarterCount * slotsPerQuarter) % playerCount;

  if (remainder === 0) return 0;

  const reducedCount = playerCount - remainder;
  return Math.min(remainder, reducedCount);
}

function getDefaultQuotaPlayerIds({
  players,
  requiredCount,
  selectionType,
}: {
  players: Player[];
  requiredCount: number;
  selectionType: QuotaSelectionType;
}) {
  return new Set(
    [...players]
      .sort((a, b) =>
        selectionType === "increased"
          ? a.priorityRank - b.priorityRank
          : b.priorityRank - a.priorityRank,
      )
      .slice(0, requiredCount)
      .map((player) => player.id),
  );
}

function getReducedPlayerIdsFromQuotaSelection({
  quotaPlayerIds,
  selectedPlayers,
  selectionType,
}: {
  quotaPlayerIds: Set<string>;
  selectedPlayers: Player[];
  selectionType: QuotaSelectionType;
}) {
  if (selectionType === "reduced") return [...quotaPlayerIds];

  return selectedPlayers
    .filter((player) => !quotaPlayerIds.has(player.id))
    .map((player) => player.id);
}

/**
 * 경기명, 날짜, 쿼터 수, GK 고정, 포메이션을 입력하는 기본 정보 섹션입니다.
 */
function MatchInfoFields({
  formationKey,
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
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">경기 정보</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-foreground">
            경기명
            <span className="ml-1 font-normal text-muted">(선택)</span>
          </span>
          <input
            name="name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-border px-3 text-sm outline-none transition focus:border-primary"
            placeholder="비워두면 이름 없이 생성됩니다"
          />
          {state.errors?.name ? (
            <span className="mt-1 block text-xs text-mismatch">
              {state.errors.name[0]}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">날짜</span>
          <input
            name="matchDate"
            type="date"
            value={matchDate}
            onChange={(event) => onMatchDateChange(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-border px-3 text-sm outline-none transition focus:border-primary"
          />
          {state.errors?.matchDate ? (
            <span className="mt-1 block text-xs text-mismatch">
              {state.errors.matchDate[0]}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">쿼터 수</span>
          <input
            name="quarterCount"
            type="number"
            min={1}
            max={8}
            value={quarterCount}
            onChange={(event) =>
              onQuarterCountChange(Number(event.target.value) || 1)
            }
            className="mt-2 min-h-11 w-full rounded-lg border border-border px-3 text-sm outline-none transition focus:border-primary"
          />
          {state.errors?.quarterCount ? (
            <span className="mt-1 block text-xs text-mismatch">
              {state.errors.quarterCount[0]}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">포메이션</span>
          <select
            name="formation"
            value={formationKey}
            onChange={(event) => onFormationChange(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
          >
            {FORMATION_PRESETS.map((preset) => (
              <option key={preset.key} value={preset.key}>
                {preset.label}
              </option>
            ))}
          </select>
          {state.errors?.formation ? (
            <span className="mt-1 block text-xs text-mismatch">
              {state.errors.formation[0]}
            </span>
          ) : null}
        </label>

        <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 md:mt-7">
          <span>
            <span className="block text-sm font-semibold text-foreground">
              GK 고정
            </span>
            <span className="block text-xs text-muted">
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

/**
 * 등록 선수가 많아도 참가 여부를 모달 안에서 관리할 수 있게 하는 선택 UI입니다.
 *
 * 기본은 전체 참가이며, 체크된 선수가 이번 경기에 참가합니다.
 */
function PlayerSelectionModal({
  onSelectedPlayerIdsChange,
  players,
  selectedPlayerIds,
}: PlayerSelectionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const [draftSelectedPlayerIds, setDraftSelectedPlayerIds] = useState(
    () => new Set(selectedPlayerIds),
  );
  const selectedCount = selectedPlayerIds.size;
  const excludedCount = players.length - selectedCount;
  const draftSelectedCount = draftSelectedPlayerIds.size;
  const draftExcludedCount = players.length - draftSelectedCount;
  const filteredPlayers = search
    ? players.filter((player) =>
        `${player.name} ${formatPositions(player)}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : players;

  function openModal() {
    setDraftSelectedPlayerIds(new Set(selectedPlayerIds));
    setSearch("");
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) closeModal();
  }

  function selectAllPlayers() {
    setDraftSelectedPlayerIds(new Set(players.map((player) => player.id)));
  }

  function clearAllPlayers() {
    setDraftSelectedPlayerIds(new Set());
  }

  function togglePlayer(playerId: string) {
    setDraftSelectedPlayerIds((current) => {
      const next = new Set(current);

      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }

      return next;
    });
  }

  function commitSelection() {
    onSelectedPlayerIdsChange(new Set(draftSelectedPlayerIds));
    closeModal();
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            참가 선수
          </h3>
          <p className="mt-1 text-sm text-muted">
            이번 경기에 참가할 선수를 선택하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
        >
          <Users size={18} aria-hidden="true" />
          참가 선수 관리
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg bg-mint-surface px-3 py-2">
          <p className="text-xs font-medium text-muted">참가</p>
          <p className="text-base font-bold text-primary">{selectedCount}명</p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-xs font-medium text-muted">미참가</p>
          <p className="text-base font-bold text-foreground">
            {excludedCount}명
          </p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-xs font-medium text-muted">등록 선수</p>
          <p className="text-base font-bold text-foreground">
            {players.length}명
          </p>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="m-auto w-[min(calc(100vw-2rem),42rem)] rounded-2xl bg-card p-0 shadow-xl backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h4 className="text-base font-semibold text-foreground">
              참가 선수 관리
            </h4>
            <p className="mt-1 text-xs text-muted">
              완료를 누르면 선택 변경이 경기 설정에 반영됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="닫기"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-mint-surface hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="선수 이름 또는 포지션 검색"
                className="min-h-10 w-full rounded-lg border border-border pl-8 pr-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={selectAllPlayers}
              className="min-h-10 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={clearAllPlayers}
              className="min-h-10 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              전체 해제
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-xs font-medium text-muted">선택됨</p>
              <p className="text-base font-bold text-foreground">
                {draftSelectedCount}명
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-xs font-medium text-muted">제외됨</p>
              <p className="text-base font-bold text-foreground">
                {draftExcludedCount}명
              </p>
            </div>
          </div>

          <div className="max-h-[55dvh] space-y-2 overflow-y-auto pr-1">
            {filteredPlayers.map((player) => {
              const selected = draftSelectedPlayerIds.has(player.id);

              return (
                <label
                  key={player.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    selected
                      ? "border-primary/55 bg-background shadow-sm"
                      : "border-border bg-card hover:border-primary/35"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => togglePlayer(player.id)}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {player.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      우선순위 #{player.priorityRank}
                    </span>
                    <PlayerPositionBadges player={player} />
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="button"
              onClick={commitSelection}
              className="min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              완료
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}

/**
 * 계산된 필요 인원 수에 맞춰 쿼터 보정 대상자를 선택하는 섹션입니다.
 */
function ReducedQuotaSelector({
  formationLabel,
  gkFixed,
  onQuotaPlayerIdsChange,
  quarterCount,
  quotaPlayerIds,
  quotaSelectionType,
  requiredCount,
  selectedPlayers,
  slotsPerQuarter,
}: ReducedQuotaSelectorProps) {
  const selectedCount = quotaPlayerIds.size;
  const disabled = requiredCount === 0 || selectedPlayers.length === 0;
  const totalSlots = quarterCount * slotsPerQuarter;
  const baseQuota =
    selectedPlayers.length > 0 ? Math.floor(totalSlots / selectedPlayers.length) : 0;
  const increasedPlayerCount =
    selectedPlayers.length > 0 ? totalSlots % selectedPlayers.length : 0;
  const reducedPlayerCount =
    increasedPlayerCount === 0
      ? 0
      : selectedPlayers.length - increasedPlayerCount;
  const title =
    quotaSelectionType === "increased" ? "많은 쿼터 배정" : "적은 쿼터 배정";
  const description =
    quotaSelectionType === "increased"
      ? "다른 선수보다 1쿼터 더 뛰는 선수를 선택합니다."
      : "다른 선수보다 1쿼터 덜 뛰는 선수를 선택합니다.";
  const emptyMessage =
    requiredCount === 0
      ? "모든 선수가 동일한 쿼터 수로 배정됩니다."
      : "참가 선수가 없습니다.";
  const calculationMessage =
    increasedPlayerCount === 0
      ? `총 ${totalSlots}자리를 ${selectedPlayers.length}명이 나누어 모든 선수가 ${baseQuota}쿼터씩 뜁니다.`
      : `총 ${totalSlots}자리를 ${selectedPlayers.length}명이 나누어 ${increasedPlayerCount}명은 ${baseQuota + 1}쿼터, ${reducedPlayerCount}명은 ${baseQuota}쿼터를 뜁니다.`;
  const selectionReason =
    quotaSelectionType === "increased"
      ? `선택 수가 더 적은 ${increasedPlayerCount}명의 많은 쿼터 배정 선수를 고릅니다.`
      : `선택 수가 더 적은 ${reducedPlayerCount}명의 적은 쿼터 배정 선수를 고릅니다.`;

  function toggleQuotaPlayer(playerId: string) {
    const next = new Set(quotaPlayerIds);

    if (next.has(playerId)) {
      next.delete(playerId);
    } else if (next.size < requiredCount) {
      next.add(playerId);
    }

    onQuotaPlayerIdsChange(next);
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {description}
          </p>
        </div>
        <p
          className={`text-sm font-semibold ${
            selectedCount === requiredCount ? "text-primary" : "text-mismatch"
          }`}
        >
          {selectedCount} / {requiredCount}명
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs font-medium text-muted">포메이션</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {formationLabel}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs font-medium text-muted">쿼터</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {quarterCount}개
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs font-medium text-muted">참가</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {selectedPlayers.length}명
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs font-medium text-muted">GK</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {gkFixed ? "고정" : "자동"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          {calculationMessage}
        </p>
        {requiredCount > 0 ? (
          <p className="mt-1 text-xs text-muted">{selectionReason}</p>
        ) : null}
        {gkFixed ? (
          <p className="mt-1 text-xs text-muted">
            GK 고정 시 골키퍼는 모든 쿼터에 배정되고, 나머지 선수 쿼터가 자동 조정됩니다.
          </p>
        ) : null}
      </div>

      {disabled ? (
        <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {selectedPlayers.map((player) => {
            const checked = quotaPlayerIds.has(player.id);
            const selectionBlocked = !checked && selectedCount >= requiredCount;

            return (
              <label
                key={player.id}
                className={`rounded-lg border p-3 transition ${
                  checked
                    ? "border-primary bg-mint-surface"
                    : "border-border bg-card"
                } ${
                  selectionBlocked
                    ? "cursor-not-allowed opacity-45"
                    : "cursor-pointer"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={selectionBlocked}
                    onChange={() => toggleQuotaPlayer(player.id)}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {player.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      #{player.priorityRank} / {formatPositions(player)}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * 새 경기 생성 폼입니다.
 *
 * 기본 경기 정보 입력, 참가 선수 모달 관리, 계산된 쿼터 보정 대상 선택을
 * 하나의 서버 액션 제출 흐름으로 연결합니다.
 */
export function MatchCreateForm({ players }: MatchCreateFormProps) {
  const [state, action] = useActionState(createMatch, initialState);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [quarterCount, setQuarterCount] = useState(4);
  const [formationKey, setFormationKey] = useState(FORMATION_PRESETS[0]?.key ?? "");
  const [gkFixed, setGkFixed] = useState(true);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    () => new Set(players.map((player) => player.id)),
  );
  const [quotaPlayerIds, setQuotaPlayerIds] = useState(() => {
    const initialPreset = FORMATION_PRESETS[0];
    const initialSelectionType = getQuotaSelectionType({
      playerCount: players.length,
      quarterCount: 4,
      slotsPerQuarter: initialPreset?.slots.length ?? 0,
    });
    const initialRequiredCount = getQuotaSelectionCount({
      playerCount: players.length,
      quarterCount: 4,
      slotsPerQuarter: initialPreset?.slots.length ?? 0,
    });

    return getDefaultQuotaPlayerIds({
      players,
      requiredCount: initialRequiredCount,
      selectionType: initialSelectionType,
    });
  });
  const selectedPlayers = useMemo(
    () => players.filter((player) => selectedPlayerIds.has(player.id)),
    [players, selectedPlayerIds],
  );
  const formationPreset =
    FORMATION_PRESETS.find((preset) => preset.key === formationKey) ??
    FORMATION_PRESETS[0];
  const slotsPerQuarter = formationPreset?.slots.length ?? 0;
  const quotaSelectionType = getQuotaSelectionType({
    playerCount: selectedPlayers.length,
    quarterCount,
    slotsPerQuarter,
  });
  const requiredQuotaSelectionCount = getQuotaSelectionCount({
    playerCount: selectedPlayers.length,
    quarterCount,
    slotsPerQuarter,
  });
  const reducedPlayerIds = useMemo(
    () =>
      getReducedPlayerIdsFromQuotaSelection({
        quotaPlayerIds,
        selectedPlayers,
        selectionType: quotaSelectionType,
      }),
    [quotaPlayerIds, quotaSelectionType, selectedPlayers],
  );
  const canCreateMatch = quotaPlayerIds.size === requiredQuotaSelectionCount;
  const setupError =
    selectedPlayers.length < slotsPerQuarter
      ? `${formationPreset?.label ?? "선택한"} 포메이션은 최소 ${slotsPerQuarter}명이 필요합니다.`
      : null;
  const canProceed = !setupError && quarterCount >= 1 && quarterCount <= 8;

  function resetQuotaPlayers({
    nextFormationKey = formationKey,
    nextQuarterCount = quarterCount,
    nextSelectedPlayerIds = selectedPlayerIds,
  }: {
    nextFormationKey?: string;
    nextQuarterCount?: number;
    nextSelectedPlayerIds?: Set<string>;
  }) {
    const nextPreset =
      FORMATION_PRESETS.find((preset) => preset.key === nextFormationKey) ??
      FORMATION_PRESETS[0];
    const nextSelectedPlayers = players.filter((player) =>
      nextSelectedPlayerIds.has(player.id),
    );
    const nextSelectionType = getQuotaSelectionType({
      playerCount: nextSelectedPlayers.length,
      quarterCount: nextQuarterCount,
      slotsPerQuarter: nextPreset?.slots.length ?? 0,
    });
    const nextRequiredCount = getQuotaSelectionCount({
      playerCount: nextSelectedPlayers.length,
      quarterCount: nextQuarterCount,
      slotsPerQuarter: nextPreset?.slots.length ?? 0,
    });

    setQuotaPlayerIds(
      getDefaultQuotaPlayerIds({
        players: nextSelectedPlayers,
        requiredCount: nextRequiredCount,
        selectionType: nextSelectionType,
      }),
    );
  }

  function handleFormationChange(value: string) {
    setFormationKey(value);
    resetQuotaPlayers({ nextFormationKey: value });
  }

  function handleQuarterCountChange(value: number) {
    setQuarterCount(value);
    resetQuotaPlayers({ nextQuarterCount: value });
  }

  function handleSelectedPlayerIdsChange(nextPlayerIds: Set<string>) {
    setSelectedPlayerIds(nextPlayerIds);
    resetQuotaPlayers({ nextSelectedPlayerIds: nextPlayerIds });
  }

  function proceedToReducedQuotaStep() {
    if (!canProceed) return;
    resetQuotaPlayers({});
    setStep(2);
  }

  return (
    <form action={action} className="space-y-6">
      <StepIndicator step={step} />

      {step === 2 ? (
        <>
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="matchDate" value={matchDate} />
          <input type="hidden" name="quarterCount" value={quarterCount} />
          <input type="hidden" name="formation" value={formationKey} />
          {gkFixed ? <input type="hidden" name="gkFixed" value="on" /> : null}
        </>
      ) : null}

      {selectedPlayers.map((player) => (
        <input key={player.id} type="hidden" name="playerIds" value={player.id} />
      ))}
      {step === 2
        ? reducedPlayerIds.map((playerId) => (
            <input
              key={playerId}
              type="hidden"
              name="reducedPlayerIds"
              value={playerId}
            />
          ))
        : null}

      {step === 1 ? (
        <>
          <MatchInfoFields
            formationKey={formationKey}
            gkFixed={gkFixed}
            matchDate={matchDate}
            name={name}
            onFormationChange={handleFormationChange}
            onGkFixedChange={setGkFixed}
            onMatchDateChange={setMatchDate}
            onNameChange={setName}
            onQuarterCountChange={handleQuarterCountChange}
            quarterCount={quarterCount}
            state={state}
          />

          <PlayerSelectionModal
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            onSelectedPlayerIdsChange={handleSelectedPlayerIdsChange}
          />
          {setupError ? (
            <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-mismatch">
              {setupError}
            </p>
          ) : null}
          {state.errors?.playerIds ? (
            <span className="block text-xs text-mismatch">
              {state.errors.playerIds[0]}
            </span>
          ) : null}
        </>
      ) : (
        <ReducedQuotaSelector
          formationLabel={formationPreset?.label ?? formationKey}
          gkFixed={gkFixed}
          quarterCount={quarterCount}
          quotaPlayerIds={quotaPlayerIds}
          quotaSelectionType={quotaSelectionType}
          requiredCount={requiredQuotaSelectionCount}
          selectedPlayers={selectedPlayers}
          slotsPerQuarter={slotsPerQuarter}
          onQuotaPlayerIdsChange={setQuotaPlayerIds}
        />
      )}

      {state.errors?.reducedPlayerIds ? (
        <span className="block text-xs text-mismatch">
          {state.errors.reducedPlayerIds[0]}
        </span>
      ) : null}

      {state.message ? (
        <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-mismatch">
          {state.message}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:justify-end lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
        {step === 1 ? (
          <button
            type="button"
            onClick={proceedToReducedQuotaStep}
            disabled={!canProceed}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-45 sm:w-auto"
          >
            다음
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground sm:w-auto"
            >
              이전
            </button>
            <SubmitButton
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
              disabled={!canCreateMatch}
              pendingLabel="생성 중"
            >
              <CalendarPlus size={18} aria-hidden="true" />
              경기 생성
            </SubmitButton>
          </>
        )}
      </div>
    </form>
  );
}
