import type { MatchInfoPatch } from "@/features/match-create/model/matchDraft";
import { FIELD_CONTROL_CLASS, FieldShell } from "./FieldShell";

type Props = {
  error?: string;
  matchDate: string;
  onChange: (patch: MatchInfoPatch) => void;
};

export function MatchDateField({ error, matchDate, onChange }: Props) {
  return (
    <FieldShell error={error} label="날짜">
      <input
        type="date"
        value={matchDate}
        onClick={(event) => openDatePicker(event.currentTarget)}
        onChange={(event) => onChange({ matchDate: event.target.value })}
        className={`${FIELD_CONTROL_CLASS} cursor-pointer`}
      />
    </FieldShell>
  );
}

function openDatePicker(input: HTMLInputElement) {
  try {
    input.showPicker?.();
  } catch {
    input.focus();
  }
}
