"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEventHandler, MouseEvent, ReactNode, Ref } from "react";
import { Check, Minus, Search, Users, X } from "lucide-react";
import type { Player } from "@/entities/player";
import {
  formatPlayerName,
  formatPositions,
} from "@/features/match-create/lib/playerFormat";
import { PlayerPositionBadges } from "./PlayerPositionBadges";

type PlayerSortKey = "name" | "number" | "priority";
type SortDirection = "asc" | "desc";

type PlayerSelectionModalProps = {
  actionSlot?: ReactNode;
  guestCount?: number;
  onSelectedPlayerIdsChange: (playerIds: Set<string>) => void;
  players: Player[];
  selectedPlayerIds: Set<string>;
};

type SelectionCheckboxProps = {
  ariaLabel?: string;
  checked: boolean;
  className?: string;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  isIndeterminate?: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

/**
 * 등록 선수 중 이번 경기에 참가할 선수를 모달 안에서 선택합니다.
 */
export function PlayerSelectionModal({
  actionSlot,
  guestCount = 0,
  onSelectedPlayerIdsChange,
  players,
  selectedPlayerIds,
}: PlayerSelectionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mobileVisiblePlayersCheckboxRef = useRef<HTMLInputElement>(null);
  const visiblePlayersCheckboxRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [sortKey, setSortKey] = useState<PlayerSortKey>("priority");
  const [draftSelectedPlayerIds, setDraftSelectedPlayerIds] = useState(
    () => new Set(selectedPlayerIds),
  );
  const rosterSelectedCount = selectedPlayerIds.size;
  const totalParticipantCount = rosterSelectedCount + guestCount;
  const draftSelectedCount = draftSelectedPlayerIds.size;
  const draftExcludedCount = players.length - draftSelectedCount;
  const sortedPlayers = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const filteredPlayers = searchText
      ? players.filter((player) =>
          `${formatPlayerName(player)} ${formatPositions(player)}`
            .toLowerCase()
            .includes(searchText),
        )
      : players;

    return [...filteredPlayers].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "name") {
        return a.name.localeCompare(b.name) * direction;
      }

      if (sortKey === "number") {
        if (a.playerNumber === null && b.playerNumber === null) {
          return a.name.localeCompare(b.name);
        }

        if (a.playerNumber === null) return 1;
        if (b.playerNumber === null) return -1;

        const aNumber = a.playerNumber;
        const bNumber = b.playerNumber;

        if (aNumber !== bNumber) return (aNumber - bNumber) * direction;

        return a.name.localeCompare(b.name);
      }

      if (a.priorityRank !== b.priorityRank) {
        return (a.priorityRank - b.priorityRank) * direction;
      }

      return a.name.localeCompare(b.name);
    });
  }, [players, search, sortDirection, sortKey]);
  const visiblePlayerIds = useMemo(
    () => sortedPlayers.map((player) => player.id),
    [sortedPlayers],
  );
  const visibleSelectedCount = visiblePlayerIds.filter((playerId) =>
    draftSelectedPlayerIds.has(playerId),
  ).length;
  const hasVisiblePlayers = visiblePlayerIds.length > 0;
  const areAllVisiblePlayersSelected =
    hasVisiblePlayers && visibleSelectedCount === visiblePlayerIds.length;
  const hasPartialVisibleSelection =
    visibleSelectedCount > 0 && visibleSelectedCount < visiblePlayerIds.length;

  useEffect(() => {
    if (mobileVisiblePlayersCheckboxRef.current) {
      mobileVisiblePlayersCheckboxRef.current.indeterminate =
        hasPartialVisibleSelection;
    }

    if (visiblePlayersCheckboxRef.current) {
      visiblePlayersCheckboxRef.current.indeterminate =
        hasPartialVisibleSelection;
    }
  }, [hasPartialVisibleSelection]);

  /**
   * 현재 확정된 참가 선수 목록을 초안으로 복사하고 모달을 엽니다.
   */
  function openModal() {
    setDraftSelectedPlayerIds(new Set(selectedPlayerIds));
    setSearch("");
    dialogRef.current?.showModal();
  }

  /**
   * 참가 선수 선택 모달을 닫습니다.
   */
  function closeModal() {
    dialogRef.current?.close();
  }

  /**
   * dialog 배경을 클릭했을 때만 모달을 닫습니다.
   */
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) closeModal();
  }

  /**
   * 현재 검색 결과에 보이는 선수들을 한 번에 참가 또는 제외 처리합니다.
   */
  function toggleVisiblePlayers() {
    setDraftSelectedPlayerIds((current) => {
      const next = new Set(current);

      if (areAllVisiblePlayersSelected) {
        visiblePlayerIds.forEach((playerId) => next.delete(playerId));
      } else {
        visiblePlayerIds.forEach((playerId) => next.add(playerId));
      }

      return next;
    });
  }

  /**
   * 데스크톱 컬럼 헤더 클릭으로 정렬 기준과 방향을 전환합니다.
   */
  function toggleSort(nextSortKey: PlayerSortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  /**
   * 모바일 select에서 선택한 기준으로 오름차순 정렬합니다.
   */
  function handleMobileSortChange(value: PlayerSortKey) {
    setSortKey(value);
    setSortDirection("asc");
  }

  function getSortLabel(targetSortKey: PlayerSortKey) {
    if (sortKey !== targetSortKey) return "";

    return sortDirection === "asc" ? " 오름차순" : " 내림차순";
  }

  function renderSortButton(label: string, targetSortKey: PlayerSortKey) {
    const isActive = sortKey === targetSortKey;

    return (
      <button
        type="button"
        onClick={() => toggleSort(targetSortKey)}
        className={`hover:text-primary inline-flex min-h-9 items-center gap-1 text-[11px] font-semibold transition ${
          isActive ? "text-primary" : "text-muted"
        }`}
      >
        {label}
        <span aria-hidden="true">
          {isActive ? (sortDirection === "asc" ? "↑" : "↓") : ""}
        </span>
        <span className="sr-only">{getSortLabel(targetSortKey)}</span>
      </button>
    );
  }

  /**
   * 특정 선수의 참가 여부를 초안 안에서 토글합니다.
   */
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

  /**
   * 초안 선택값을 경기 생성 폼의 실제 참가 선수 목록으로 확정합니다.
   */
  function commitSelection() {
    onSelectedPlayerIdsChange(new Set(draftSelectedPlayerIds));
    closeModal();
  }

  return (
    <section className="border-border bg-card rounded-lg border p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-foreground text-base font-semibold">
            이번 경기 선수
          </h3>
          <p className="text-muted mt-1 text-sm">
            팀 선수와 용병을 합쳐 이번 경기 배치 인원을 준비하세요.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={openModal}
            className="border-border text-foreground hover:border-primary hover:text-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition"
          >
            <Users size={18} aria-hidden="true" />팀 선수 선택
          </button>
          {actionSlot}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="bg-mint-surface rounded-lg px-3 py-2">
          <p className="text-muted text-xs font-medium">팀 선수</p>
          <p className="text-primary text-base font-bold">
            {rosterSelectedCount}명
          </p>
        </div>
        <div className="border-border rounded-lg border px-3 py-2">
          <p className="text-muted text-xs font-medium">용병</p>
          <p className="text-foreground text-base font-bold">{guestCount}명</p>
        </div>
        <div className="border-border rounded-lg border px-3 py-2">
          <p className="text-muted text-xs font-medium">총 참가</p>
          <p className="text-foreground text-base font-bold">
            {totalParticipantCount}명
          </p>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="bg-card m-auto w-[min(calc(100vw-2rem),42rem)] rounded-2xl p-0 shadow-xl backdrop:bg-black/50"
      >
        <div className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h4 className="text-foreground text-base font-semibold">
              팀 선수 선택
            </h4>
            <p className="text-muted mt-1 text-xs">
              이번 경기에 뛸 팀 선수를 고르고 완료하세요.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="bg-mint-surface text-primary rounded-full px-3 py-1 text-xs font-semibold">
                참가 예정 {draftSelectedCount}명
              </span>
              <span className="bg-surface text-muted rounded-full px-3 py-1 text-xs font-semibold">
                제외 {draftExcludedCount}명
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="닫기"
            className="text-muted hover:bg-mint-surface hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg transition"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={15}
                aria-hidden="true"
                className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="선수 이름 또는 포지션 검색"
                className="border-border focus:border-primary min-h-10 w-full rounded-lg border pr-3 pl-8 text-sm transition outline-none"
              />
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <select
                value={sortKey}
                onChange={(event) =>
                  handleMobileSortChange(event.target.value as PlayerSortKey)
                }
                className="border-border bg-card text-foreground focus:border-primary min-h-10 rounded-lg border px-3 text-sm font-semibold transition outline-none sm:hidden"
                aria-label="선수 목록 정렬"
              >
                <option value="priority">우선순위순</option>
                <option value="name">이름순</option>
                <option value="number">등번호순</option>
              </select>
              <label className="border-border text-foreground inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold sm:hidden">
                <SelectionCheckbox
                  inputRef={mobileVisiblePlayersCheckboxRef}
                  checked={areAllVisiblePlayersSelected}
                  disabled={!hasVisiblePlayers}
                  isIndeterminate={hasPartialVisibleSelection}
                  onChange={toggleVisiblePlayers}
                />
                {areAllVisiblePlayersSelected
                  ? "현재 목록 모두 제외"
                  : "현재 목록 모두 참가"}
              </label>
            </div>
          </div>

          <div className="max-h-[55dvh] overflow-y-auto pr-1">
            <div className="border-border bg-surface/70 hidden min-w-0 grid-cols-[44px_minmax(9rem,1.3fr)_5rem_minmax(9rem,1fr)_5.5rem] items-center gap-3 rounded-t-lg border px-3 py-1.5 sm:grid">
              <SelectionCheckbox
                inputRef={visiblePlayersCheckboxRef}
                checked={areAllVisiblePlayersSelected}
                disabled={!hasVisiblePlayers}
                isIndeterminate={hasPartialVisibleSelection}
                onChange={toggleVisiblePlayers}
                ariaLabel="현재 목록 선수 전체 선택"
              />
              {renderSortButton("이름", "name")}
              {renderSortButton("등번호", "number")}
              <span className="text-muted text-[11px] font-semibold">
                포지션
              </span>
              {renderSortButton("우선순위", "priority")}
            </div>

            <div className="border-border overflow-hidden rounded-lg border sm:rounded-t-none sm:border-t-0">
              {sortedPlayers.length > 0 ? (
                sortedPlayers.map((player) => {
                  const selected = draftSelectedPlayerIds.has(player.id);

                  return (
                    <label
                      key={player.id}
                      className={`border-border relative grid min-h-14 cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 border-b p-3 transition last:border-b-0 sm:grid-cols-[44px_minmax(9rem,1.3fr)_5rem_minmax(9rem,1fr)_5.5rem] sm:items-center sm:px-3 sm:py-2.5 ${
                        selected
                          ? "bg-mint-surface/45"
                          : "bg-card hover:bg-surface/55"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute top-2 bottom-2 left-0 w-1 rounded-r-full transition ${
                          selected ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                      <SelectionCheckbox
                        checked={selected}
                        onChange={() => togglePlayer(player.id)}
                        className="mt-0.5 sm:mt-0"
                      />
                      <span className="min-w-0">
                        <span className="text-foreground block text-sm font-semibold">
                          {formatPlayerName(player)}
                        </span>
                        <span className="text-muted mt-1 block text-xs sm:hidden">
                          {player.playerNumber !== null
                            ? `등번호 ${player.playerNumber}`
                            : "등번호 없음"}{" "}
                          · 우선순위 #{player.priorityRank}
                        </span>
                      </span>
                      <span className="text-foreground hidden text-center text-sm font-semibold sm:block">
                        {player.playerNumber ?? "-"}
                      </span>
                      <span className="col-start-2 sm:col-start-auto">
                        <PlayerPositionBadges player={player} />
                      </span>
                      <span className="text-foreground hidden text-center text-sm font-semibold sm:block">
                        #{player.priorityRank}
                      </span>
                    </label>
                  );
                })
              ) : (
                <p className="border-border text-muted rounded-lg border border-dashed px-3 py-4 text-sm">
                  검색 결과가 없습니다.
                </p>
              )}
            </div>
          </div>

          <div className="border-border flex justify-end border-t pt-4">
            <button
              type="button"
              onClick={commitSelection}
              className="bg-primary text-primary-foreground min-h-10 rounded-lg px-4 text-sm font-semibold"
            >
              선택 완료
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}

/**
 * 전체 선택의 indeterminate 상태까지 표현하는 커스텀 체크박스입니다.
 */
function SelectionCheckbox({
  ariaLabel,
  checked,
  className = "",
  disabled = false,
  inputRef,
  isIndeterminate = false,
  onChange,
}: SelectionCheckboxProps) {
  const isActive = checked || isIndeterminate;

  return (
    <span
      className={`relative inline-flex size-5 shrink-0 items-center justify-center ${className}`}
    >
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={ariaLabel}
        aria-checked={isIndeterminate ? "mixed" : checked}
        className="absolute inset-0 z-10 size-5 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        className={`flex size-5 items-center justify-center rounded-md border transition ${
          isActive
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-transparent"
        } ${disabled ? "opacity-40" : ""}`}
      >
        {isIndeterminate ? (
          <Minus size={14} strokeWidth={3} />
        ) : (
          <Check size={14} strokeWidth={3} />
        )}
      </span>
    </span>
  );
}
