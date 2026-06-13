"use client";

import { useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";
import {
  PLAYER_POSITION_CODES,
  type PlayerPositionCode,
} from "@/entities/position";
import type { GuestPlayerDraft } from "@/features/match-create/model/types";

type GuestPlayerModalProps = {
  guestPlayers: GuestPlayerDraft[];
  nextPriorityRank: number;
  onGuestPlayersChange: (guestPlayers: GuestPlayerDraft[]) => void;
};

type GuestPlayerFormState = {
  editingId: string | null;
  mainPosition: PlayerPositionCode;
  name: string;
  subPositions: Set<PlayerPositionCode>;
};

const DEFAULT_MAIN_POSITION: PlayerPositionCode = "CM";

function createInitialFormState(): GuestPlayerFormState {
  return {
    editingId: null,
    mainPosition: DEFAULT_MAIN_POSITION,
    name: "",
    subPositions: new Set(),
  };
}

/**
 * 경기 생성 중에만 사용하는 용병 선수를 추가, 수정, 삭제합니다.
 */
export function GuestPlayerModal({
  guestPlayers,
  nextPriorityRank,
  onGuestPlayersChange,
}: GuestPlayerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(() => createInitialFormState());
  const [error, setError] = useState<string | null>(null);
  const sortedGuests = useMemo(
    () => [...guestPlayers].sort((a, b) => a.priorityRank - b.priorityRank),
    [guestPlayers],
  );

  function openModal() {
    setForm(createInitialFormState());
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) closeModal();
  }

  function toggleSubPosition(position: PlayerPositionCode) {
    setForm((current) => {
      const next = new Set(current.subPositions);

      if (next.has(position)) {
        next.delete(position);
      } else {
        next.add(position);
      }

      return { ...current, subPositions: next };
    });
  }

  function startEdit(guest: GuestPlayerDraft) {
    setForm({
      editingId: guest.id,
      mainPosition: guest.mainPosition,
      name: guest.name,
      subPositions: new Set(guest.subPositions),
    });
    setError(null);
  }

  function removeGuest(guestId: string) {
    onGuestPlayersChange(guestPlayers.filter((guest) => guest.id !== guestId));
    if (form.editingId === guestId) {
      setForm(createInitialFormState());
    }
  }

  function submitGuest() {
    const name = form.name.trim();
    const editingGuest = form.editingId
      ? guestPlayers.find((guest) => guest.id === form.editingId)
      : null;

    if (!name) {
      setError("이름을 입력해주세요.");
      return;
    }

    const nextGuest: GuestPlayerDraft = {
      id: form.editingId ?? crypto.randomUUID(),
      mainPosition: form.mainPosition,
      name,
      playerNumber: null,
      priorityRank: editingGuest?.priorityRank ?? nextPriorityRank,
      subPositions: [...form.subPositions].filter(
        (position) => position !== form.mainPosition,
      ),
    };

    onGuestPlayersChange(
      form.editingId
        ? guestPlayers.map((guest) =>
            guest.id === form.editingId ? nextGuest : guest,
          )
        : [...guestPlayers, nextGuest],
    );
    setForm(createInitialFormState());
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <UserPlus size={18} aria-hidden="true" />
        용병 추가
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="m-auto w-[min(calc(100vw-2rem),44rem)] rounded-2xl bg-card p-0 shadow-xl backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h4 className="text-base font-semibold text-foreground">
              용병 추가
            </h4>
            <p className="mt-1 text-xs text-muted">
              이번 경기에서만 사용할 임시 선수를 등록합니다.
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

        <div className="grid max-h-[78dvh] gap-5 overflow-y-auto px-5 py-4 md:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">
                이름
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="mt-1 min-h-10 w-full rounded-lg border border-border px-3 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">
                주 포지션
              </label>
              <select
                value={form.mainPosition}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mainPosition: event.target.value as PlayerPositionCode,
                  }))
                }
                className="mt-1 min-h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
              >
                {PLAYER_POSITION_CODES.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">부 포지션</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLAYER_POSITION_CODES.map((position) => {
                  const checked = form.subPositions.has(position);
                  const disabled = position === form.mainPosition;

                  return (
                    <label
                      key={position}
                      className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm ${
                        checked
                          ? "border-primary bg-mint-surface text-primary"
                          : "border-border text-foreground"
                      } ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleSubPosition(position)}
                        className="size-4 accent-primary"
                      />
                      {position}
                    </label>
                  );
                })}
              </div>
            </div>

            {error ? (
              <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-mismatch">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              {form.editingId ? (
                <button
                  type="button"
                  onClick={() => setForm(createInitialFormState())}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground"
                >
                  새로 입력
                </button>
              ) : null}
              <button
                type="button"
                onClick={submitGuest}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus size={16} aria-hidden="true" />
                {form.editingId ? "수정" : "추가"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              이번 경기 용병
            </p>
            {sortedGuests.length > 0 ? (
              <div className="mt-2 space-y-2">
                {sortedGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {guest.name}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {guest.mainPosition}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(guest)}
                          aria-label={`${guest.name} 수정`}
                          className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-mint-surface hover:text-foreground"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGuest(guest.id)}
                          aria-label={`${guest.name} 삭제`}
                          className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-orange-50 hover:text-mismatch"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted">
                추가된 용병이 없습니다.
              </p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
