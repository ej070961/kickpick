"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import {
  PLAYER_POSITION_CODES,
  type PlayerPositionCode,
} from "@/entities/position";
import type {
  EditorPlayer,
  GuestPlayerFormInput,
} from "@/features/formation-editor/model/types";
import { Button, SelectField, TextField } from "@/shared/ui";

type FormState = {
  mainPosition: PlayerPositionCode;
  name: string;
  playerNumberText: string;
  subPositions: Set<PlayerPositionCode>;
};

type Props = {
  initialPlayer: EditorPlayer | null;
  isPending: boolean;
  onCancelEdit: () => void;
  onSave: (input: GuestPlayerFormInput) => void;
};

/** 경기 전용 게스트의 이름, 등번호, 포지션을 추가하거나 수정합니다. */
export const GuestPlayerForm = ({
  initialPlayer,
  isPending,
  onCancelEdit,
  onSave,
}: Props) => {
  const [form, setForm] = useState<FormState>(() =>
    initialPlayer
      ? {
          mainPosition: initialPlayer.mainPosition,
          name: initialPlayer.name,
          playerNumberText: initialPlayer.playerNumber?.toString() ?? "",
          subPositions: new Set(initialPlayer.subPositions),
        }
      : createEmptyForm(),
  );

  const toggleSubPosition = (position: PlayerPositionCode) =>
    setForm((current) => {
      const subPositions = new Set(current.subPositions);
      if (subPositions.has(position)) subPositions.delete(position);
      else subPositions.add(position);
      return { ...current, subPositions };
    });

  const submit = () => {
    const name = form.name.trim();
    if (!name) return;
    onSave({
      id: initialPlayer?.id,
      mainPosition: form.mainPosition,
      name,
      playerNumber: form.playerNumberText.trim()
        ? Number(form.playerNumberText)
        : null,
      subPositions: [...form.subPositions],
    });
    setForm(createEmptyForm());
  };

  return (
    <section className="border-border bg-background rounded-lg border p-3">
      <p className="text-foreground text-sm font-semibold">
        {initialPlayer ? "게스트 수정" : "게스트 추가"}
      </p>
      <div className="mt-3 grid gap-3">
        <TextField
          label="이름"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
        />
        <TextField
          label="등번호"
          inputMode="numeric"
          value={form.playerNumberText}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              playerNumberText: event.target.value.replace(/\D/g, ""),
            }))
          }
        />
        <SelectField
          label="주 포지션"
          value={form.mainPosition}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              mainPosition: event.target.value as PlayerPositionCode,
            }))
          }
        >
          {PLAYER_POSITION_CODES.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </SelectField>
        <div>
          <p className="text-foreground text-sm font-semibold">부 포지션</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLAYER_POSITION_CODES.filter(
              (position) => position !== form.mainPosition,
            ).map((position) => {
              const checked = form.subPositions.has(position);
              return (
                <label
                  key={position}
                  className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${checked ? "border-primary bg-mint-surface text-primary" : "border-border bg-card text-muted"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSubPosition(position)}
                    className="checkbox-primary"
                  />
                  {position}
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {initialPlayer && (
            <Button variant="secondary" onClick={onCancelEdit}>
              취소
            </Button>
          )}
          <Button
            leftIcon={<UserPlus size={16} aria-hidden="true" />}
            onClick={submit}
            disabled={isPending || form.name.trim().length === 0}
          >
            {initialPlayer ? "게스트 수정" : "게스트 추가"}
          </Button>
        </div>
      </div>
    </section>
  );
};

const createEmptyForm = (): FormState => ({
  mainPosition: "CM",
  name: "",
  playerNumberText: "",
  subPositions: new Set(),
});
