"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEventHandler, Ref } from "react";
import { Check, Minus, Search } from "lucide-react";
import type { Player } from "@/entities/player";
import {
  formatPlayerName,
  formatPositions,
} from "@/features/match-create/lib/playerFormat";
import { PlayerPositionBadges } from "../PlayerPositionBadges";

type PlayerSortKey = "name" | "number" | "priority";

type Props = {
  onSelectedRegisteredPlayersChange: (playerIds: string[]) => void;
  onToggleRegisteredPlayer: (playerId: string) => void;
  players: Player[];
  selectedRegisteredPlayerIds: string[];
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
 * 등록 선수 중 이번 경기에 함께 뛸 선수를 고르는 compact 목록이다.
 *
 * 이 컴포넌트는 등록 선수 id만 다루며, 게스트와 출전 조정 계산은 상위 단계에서
 * 조합한다.
 */
export function RosterPlayerPicker({
  onSelectedRegisteredPlayersChange,
  onToggleRegisteredPlayer,
  players,
  selectedRegisteredPlayerIds,
}: Props) {
  const mobileVisiblePlayersCheckboxRef = useRef<HTMLInputElement>(null);
  const visiblePlayersCheckboxRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<PlayerSortKey>("priority");
  const selectedRegisteredPlayerIdSet = useMemo(
    () => new Set(selectedRegisteredPlayerIds),
    [selectedRegisteredPlayerIds],
  );
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
      if (sortKey === "name") return a.name.localeCompare(b.name);

      if (sortKey === "number") {
        if (a.playerNumber === null && b.playerNumber === null) {
          return a.name.localeCompare(b.name);
        }
        if (a.playerNumber === null) return 1;
        if (b.playerNumber === null) return -1;
        if (a.playerNumber !== b.playerNumber) {
          return a.playerNumber - b.playerNumber;
        }

        return a.name.localeCompare(b.name);
      }

      if (a.priorityRank !== b.priorityRank) {
        return a.priorityRank - b.priorityRank;
      }

      return a.name.localeCompare(b.name);
    });
  }, [players, search, sortKey]);
  const visiblePlayerIds = useMemo(
    () => sortedPlayers.map((player) => player.id),
    [sortedPlayers],
  );
  const visibleSelectedCount = visiblePlayerIds.filter((playerId) =>
    selectedRegisteredPlayerIdSet.has(playerId),
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

  function toggleVisiblePlayers() {
    const next = new Set(selectedRegisteredPlayerIds);

    if (areAllVisiblePlayersSelected) {
      visiblePlayerIds.forEach((playerId) => next.delete(playerId));
    } else {
      visiblePlayerIds.forEach((playerId) => next.add(playerId));
    }

    onSelectedRegisteredPlayersChange([...next]);
  }

  const visiblePlayersActionLabel = areAllVisiblePlayersSelected
    ? "현재 목록 모두 제외"
    : "현재 목록 모두 참가";

  return (
    <div className="min-w-0">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={sortKey}
            onChange={(event) =>
              setSortKey(event.target.value as PlayerSortKey)
            }
            className="border-border bg-card text-foreground focus:border-primary min-h-10 rounded-lg border px-3 text-sm font-semibold transition outline-none"
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
            {visiblePlayersActionLabel}
          </label>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="border-border bg-surface/70 hidden min-w-md grid-cols-[40px_minmax(9rem,1fr)_minmax(8rem,0.9fr)_4.75rem] items-center gap-2 rounded-t-lg border px-3 py-1.5 sm:grid">
          <SelectionCheckbox
            inputRef={visiblePlayersCheckboxRef}
            checked={areAllVisiblePlayersSelected}
            disabled={!hasVisiblePlayers}
            isIndeterminate={hasPartialVisibleSelection}
            onChange={toggleVisiblePlayers}
            ariaLabel="현재 목록 선수 전체 선택"
          />
          <span className="text-muted text-xs font-semibold">선수</span>
          <span className="text-muted text-xs font-semibold">포지션</span>
          <span className="text-muted text-center text-xs font-semibold">
            우선순위
          </span>
        </div>

        <div className="border-border overflow-hidden rounded-lg border sm:min-w-[28rem] sm:rounded-t-none sm:border-t-0">
          <RosterPlayerList
            onToggleRegisteredPlayer={onToggleRegisteredPlayer}
            players={sortedPlayers}
            selectedRegisteredPlayerIdSet={selectedRegisteredPlayerIdSet}
          />
        </div>
      </div>
    </div>
  );
}

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
        <SelectionIcon isIndeterminate={isIndeterminate} />
      </span>
    </span>
  );
}

function RosterPlayerList({
  onToggleRegisteredPlayer,
  players,
  selectedRegisteredPlayerIdSet,
}: {
  onToggleRegisteredPlayer: (playerId: string) => void;
  players: Player[];
  selectedRegisteredPlayerIdSet: Set<string>;
}) {
  if (players.length === 0) {
    return (
      <p className="border-border text-muted rounded-lg border border-dashed px-3 py-4 text-sm">
        검색 결과가 없습니다.
      </p>
    );
  }

  return players.map((player) => (
    <RosterPlayerRow
      key={player.id}
      player={player}
      selected={selectedRegisteredPlayerIdSet.has(player.id)}
      onToggle={() => onToggleRegisteredPlayer(player.id)}
    />
  ));
}

function RosterPlayerRow({
  onToggle,
  player,
  selected,
}: {
  onToggle: () => void;
  player: Player;
  selected: boolean;
}) {
  return (
    <label
      className={`border-border relative grid min-h-14 cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 border-b p-3 transition last:border-b-0 sm:grid-cols-[40px_minmax(9rem,1fr)_minmax(8rem,0.9fr)_4.75rem] sm:items-center sm:gap-2 sm:px-3 sm:py-2.5 ${
        selected ? "bg-mint-surface/45" : "bg-card hover:bg-surface/55"
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
        onChange={onToggle}
        className="mt-0.5 sm:mt-0"
      />
      <span className="min-w-0">
        <span className="text-foreground block truncate text-sm font-semibold">
          {formatPlayerName(player)}
        </span>
      </span>
      <span className="col-start-2 min-w-0 sm:col-start-auto">
        <PlayerPositionBadges player={player} />
      </span>
      <span className="text-foreground hidden text-center text-sm font-semibold sm:block">
        #{player.priorityRank}
      </span>
      <span className="text-muted col-start-2 text-xs sm:hidden">
        우선순위 #{player.priorityRank}
      </span>
    </label>
  );
}

function SelectionIcon({ isIndeterminate }: { isIndeterminate: boolean }) {
  if (isIndeterminate) return <Minus size={14} strokeWidth={3} />;

  return <Check size={14} strokeWidth={3} />;
}
