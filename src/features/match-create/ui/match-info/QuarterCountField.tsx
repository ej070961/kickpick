import type { MatchInfoPatch } from "@/features/match-create/model/matchDraft";
import { FIELD_CONTROL_CLASS, FieldShell } from "./FieldShell";

type Props = {
  error?: string;
  onChange: (patch: MatchInfoPatch) => void;
  quarterCount: number;
};

export function QuarterCountField({ error, onChange, quarterCount }: Props) {
  return (
    <FieldShell error={error} label="쿼터 수">
      <input
        type="number"
        min={1}
        max={8}
        value={quarterCount}
        onChange={(event) =>
          onChange({ quarterCount: Number(event.target.value) || 1 })
        }
        className={FIELD_CONTROL_CLASS}
      />
    </FieldShell>
  );
}
