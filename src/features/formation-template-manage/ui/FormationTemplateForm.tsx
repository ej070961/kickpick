"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import {
  FORMATION_SLOT_CODES,
  type FormationSlotCode,
} from "@/entities/position";
import type { FormationTemplateFormState } from "@/features/formation-template-manage/actions/formationTemplateActions";
import { SubmitButton } from "@/features/player-manage/ui/SubmitButton";

type FormationTemplateFormProps = {
  action: (
    state: FormationTemplateFormState,
    formData: FormData,
  ) => Promise<FormationTemplateFormState>;
};

export function FormationTemplateForm({ action }: FormationTemplateFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [name, setName] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<Set<FormationSlotCode>>(
    () => new Set(),
  );
  const selectedCount = selectedSlots.size;
  const canSubmit =
    name.trim().length > 0 && selectedCount === REQUIRED_FIELD_SLOT_COUNT;

  function toggleSlot(slot: FormationSlotCode) {
    setSelectedSlots((current) => {
      const next = new Set(current);

      if (next.has(slot)) {
        next.delete(slot);
      } else if (next.size < REQUIRED_FIELD_SLOT_COUNT) {
        next.add(slot);
      }

      return next;
    });
  }

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            새 템플릿
          </h3>
          <p className="mt-1 text-sm text-muted">
            GK는 자동 포함됩니다. 필드 슬롯 10개를 선택하세요.
          </p>
        </div>
        <p
          className={`text-sm font-bold ${
            selectedCount === REQUIRED_FIELD_SLOT_COUNT
              ? "text-primary"
              : "text-mismatch"
          }`}
        >
          {selectedCount} / {REQUIRED_FIELD_SLOT_COUNT}
        </p>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-foreground">
          포메이션 이름
        </span>
        <input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="예: 4-3-3 커스텀"
          className="mt-2 min-h-11 w-full rounded-lg border border-border px-3 text-sm outline-none transition focus:border-primary"
        />
        {state.errors?.name ? (
          <span className="mt-1 block text-xs text-mismatch">
            {state.errors.name[0]}
          </span>
        ) : null}
      </label>

      <div className="mt-4 rounded-lg border border-border bg-background px-3 py-2">
        <p className="text-xs font-medium text-muted">자동 포함</p>
        <p className="mt-1 text-sm font-bold text-foreground">GK</p>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-foreground">
          필드 슬롯
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {FIELD_SLOT_CODES.map((slot) => {
            const checked = selectedSlots.has(slot);
            const blocked =
              !checked && selectedCount >= REQUIRED_FIELD_SLOT_COUNT;

            return (
              <label
                key={slot}
                className={`inline-flex min-h-9 select-none items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
                  checked
                    ? "border-primary bg-mint-surface text-primary"
                    : "border-border text-muted hover:border-primary hover:text-foreground"
                } ${blocked ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  name="slots"
                  value={slot}
                  checked={checked}
                  disabled={blocked}
                  onChange={() => toggleSlot(slot)}
                  className="checkbox-primary"
                />
                {slot}
              </label>
            );
          })}
        </div>
        {state.errors?.slots ? (
          <span className="mt-1 block text-xs text-mismatch">
            {state.errors.slots[0]}
          </span>
        ) : null}
      </fieldset>

      {state.message ? (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            state.success
              ? "bg-mint-surface text-foreground"
              : "bg-orange-50 text-mismatch"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-45 sm:w-auto"
        disabled={!canSubmit}
        pendingLabel="저장 중"
      >
        <Plus size={18} aria-hidden="true" />
        템플릿 저장
      </SubmitButton>
    </form>
  );
}

const initialState: FormationTemplateFormState = {};
const FIELD_SLOT_CODES: FormationSlotCode[] = FORMATION_SLOT_CODES.filter(
  (position) => position !== "GK" && position !== "RC",
);
const REQUIRED_FIELD_SLOT_COUNT = 10;
