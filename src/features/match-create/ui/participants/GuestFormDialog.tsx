"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  PLAYER_POSITION_CODES,
  type PlayerPositionCode,
} from "@/entities/position";
import type { GuestPlayerDraft } from "@/features/match-create/model/types";

type Props = {
  guest?: GuestPlayerDraft;
  nextPriorityRank: number;
  onClose: () => void;
  onSave: (guest: GuestPlayerDraft) => void;
};

type GuestForm = {
  mainPosition: PlayerPositionCode;
  name: string;
  subPositions: Set<PlayerPositionCode>;
};

/**
 * 게스트 한 명을 추가하거나 수정하는 입력 전용 dialog다.
 *
 * 이미 추가한 게스트 목록은 `GuestPanel`에서만 보여주어, 모달 안 정보 중복을 줄인다.
 */
export function GuestFormDialog({
  guest,
  nextPriorityRank,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<GuestForm>(() => createInitialForm(guest));
  const [error, setError] = useState<string | null>(null);

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

  function saveGuest() {
    const name = form.name.trim();

    if (!name) {
      setError("게스트 이름을 입력해주세요.");
      return;
    }

    onSave({
      id: guest?.id ?? crypto.randomUUID(),
      mainPosition: form.mainPosition,
      name,
      playerNumber: null,
      priorityRank: guest?.priorityRank ?? nextPriorityRank,
      subPositions: [...form.subPositions].filter(
        (position) => position !== form.mainPosition,
      ),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-form-title"
        className="bg-card w-[min(calc(100vw-2rem),34rem)] rounded-2xl shadow-xl"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div>
            <h4
              id="guest-form-title"
              className="text-foreground text-base font-semibold"
            >
              {guest ? "게스트 수정" : "게스트 추가"}
            </h4>
            <p className="text-muted mt-1 text-xs">
              이번 경기에서만 함께 뛸 선수를 입력해요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-muted hover:bg-mint-surface hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg transition"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[70dvh] space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="text-foreground text-sm font-semibold">
              게스트 이름
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="border-border focus:border-primary mt-1 min-h-10 w-full rounded-lg border px-3 text-sm transition outline-none"
            />
          </div>

          <div>
            <label className="text-foreground text-sm font-semibold">
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
              className="border-border bg-card focus:border-primary mt-1 min-h-10 w-full rounded-lg border px-3 text-sm transition outline-none"
            >
              {PLAYER_POSITION_CODES.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-foreground text-sm font-semibold">부 포지션</p>
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
                    } ${
                      disabled
                        ? "cursor-not-allowed opacity-45"
                        : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleSubPosition(position)}
                      className="accent-primary size-4"
                    />
                    {position}
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-mismatch rounded-lg bg-orange-50 px-3 py-2 text-sm">
              {error}
            </p>
          )}
        </div>

        <div className="border-border flex justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-foreground inline-flex min-h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={saveGuest}
            className="bg-primary text-primary-foreground inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold"
          >
            <Plus size={16} aria-hidden="true" />
            {guest ? "수정 완료" : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_MAIN_POSITION: PlayerPositionCode = "CM";

function createInitialForm(guest?: GuestPlayerDraft): GuestForm {
  return {
    mainPosition: guest?.mainPosition ?? DEFAULT_MAIN_POSITION,
    name: guest?.name ?? "",
    subPositions: new Set(guest?.subPositions ?? []),
  };
}
