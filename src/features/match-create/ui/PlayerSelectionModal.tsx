"use client";

import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Search, Users, X } from "lucide-react";
import type { Player } from "@/entities/player";
import {
  formatPlayerName,
  formatPositions,
} from "@/features/match-create/lib/playerFormat";
import { PlayerPositionBadges } from "./PlayerPositionBadges";

type PlayerSelectionModalProps = {
  onSelectedPlayerIdsChange: (playerIds: Set<string>) => void;
  players: Player[];
  selectedPlayerIds: Set<string>;
};

/**
 * 등록 선수 중 이번 경기에 참가할 선수를 모달 안에서 선택합니다.
 */
export function PlayerSelectionModal({
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
        `${formatPlayerName(player)} ${formatPositions(player)}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : players;

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
   * 모든 등록 선수를 참가 초안에 포함합니다.
   */
  function selectAllPlayers() {
    setDraftSelectedPlayerIds(new Set(players.map((player) => player.id)));
  }

  /**
   * 참가 초안에서 모든 선수를 제외합니다.
   */
  function clearAllPlayers() {
    setDraftSelectedPlayerIds(new Set());
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
                      {formatPlayerName(player)}
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
