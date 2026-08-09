"use client";

import { useActionState, useEffect, useState } from "react";
import { Save } from "lucide-react";
import type { FormationTemplate } from "@/entities/formation";
import {
  FORMATION_SLOT_CODES,
  type FormationSlotCode,
} from "@/entities/position";
import type { TemplateFormState } from "@/features/formation-template-manage/actions/formationTemplateActions";
import { SubmitButton } from "@/features/player-manage/ui/SubmitButton";
import { cn } from "@/shared/lib/cn";

type Props = {
  action: (
    state: TemplateFormState,
    formData: FormData,
  ) => Promise<TemplateFormState>;
  description?: string;
  onSuccess?: () => void;
  showHeader?: boolean;
  template?: FormationTemplate;
  title?: string;
  variant?: "card" | "plain";
};

export function TemplateForm({
  action,
  description = "포메이션 이름과 포지션을 선택하세요.",
  onSuccess,
  showHeader = true,
  template,
  title = "⚽ 새 포메이션",
  variant = "card",
}: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const [name, setName] = useState(template?.label ?? "");
  const [selectedSlots, setSelectedSlots] = useState<FormationSlotCode[]>(() =>
    uniqueFieldSlots(template),
  );
  const selectedCount = selectedSlots.length;
  const canSubmit =
    name.trim().length > 0 && selectedCount === REQUIRED_FIELD_SLOT_COUNT;

  useEffect(() => {
    if (!state.success) return;

    if (onSuccess) {
      onSuccess();
    }
  }, [onSuccess, state.success]);

  function toggleSlot(slot: FormationSlotCode) {
    setSelectedSlots((current) => {
      if (current.includes(slot)) {
        return current.filter((selectedSlot) => selectedSlot !== slot);
      }

      if (current.length >= REQUIRED_FIELD_SLOT_COUNT) return current;

      return [...current, slot];
    });
  }

  return (
    <form
      action={formAction}
      className={cn(
        variant === "card" &&
          "border-border bg-card rounded-lg border p-4 shadow-sm",
      )}
    >
      {template ? <input type="hidden" name="id" value={template.id} /> : null}
      {selectedSlots.map((slot) => (
        <input key={slot} type="hidden" name="slots" value={slot} />
      ))}
      {showHeader ? (
        <div>
          <h3 className="text-foreground text-base font-semibold">{title}</h3>
          <p className="text-muted mt-1 text-sm">{description}</p>
        </div>
      ) : null}

      <label className={cn(showHeader ? "mt-4" : "mt-0", "block")}>
        <span className="text-foreground text-sm font-medium">
          포메이션 이름
        </span>
        <input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="예: 4-3-3"
          className="border-border focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
        />
        {state.errors?.id ? (
          <span className="text-mismatch mt-1 block text-xs">
            {state.errors.id[0]}
          </span>
        ) : null}
        {state.errors?.name ? (
          <span className="text-mismatch mt-1 block text-xs">
            {state.errors.name[0]}
          </span>
        ) : null}
      </label>

      <fieldset className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-foreground text-sm font-medium">
            포지션
          </legend>
          <span
            className={cn(
              "inline-flex h-7 min-w-14 shrink-0 items-center justify-center rounded-md px-2 text-sm font-bold whitespace-nowrap",
              selectedCount === REQUIRED_FIELD_SLOT_COUNT
                ? "bg-mint-surface text-primary"
                : "bg-surface text-muted",
            )}
          >
            {selectedCount}/{REQUIRED_FIELD_SLOT_COUNT}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {FIELD_SLOT_CODES.map((slot) => {
            const checked = selectedSlots.includes(slot);
            const blocked =
              !checked && selectedCount >= REQUIRED_FIELD_SLOT_COUNT;

            return (
              <label
                key={slot}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition select-none",
                  checked
                    ? "border-primary bg-mint-surface text-primary"
                    : "border-border text-muted hover:border-primary hover:text-foreground",
                  blocked ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                )}
              >
                <input
                  type="checkbox"
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
          <span className="text-mismatch mt-1 block text-xs">
            {state.errors.slots[0]}
          </span>
        ) : null}
      </fieldset>

      {state.message ? (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            state.success
              ? "bg-mint-surface text-foreground"
              : "text-mismatch bg-orange-50"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <SubmitButton
          className="bg-primary text-primary-foreground inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-45 sm:w-auto"
          disabled={!canSubmit}
          pendingLabel="저장 중"
        >
          <Save size={18} aria-hidden="true" />
          저장
        </SubmitButton>
      </div>
    </form>
  );
}

const initialState: TemplateFormState = {};
const FIELD_SLOT_CODES: FormationSlotCode[] = FORMATION_SLOT_CODES.filter(
  (position) => position !== "GK" && position !== "RC",
);
const REQUIRED_FIELD_SLOT_COUNT = 10;

function uniqueFieldSlots(template?: FormationTemplate) {
  return [
    ...new Set(
      template?.slots
        .map((slot) => slot.name)
        .filter((slot) => FIELD_SLOT_CODES.includes(slot)) ?? [],
    ),
  ];
}
