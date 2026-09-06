import { ChevronDown } from "lucide-react";
import type { FormationTemplate } from "@/entities/formation";
import type { MatchInfoPatch } from "@/features/match-create/model/matchDraft";
import { FIELD_CONTROL_CLASS, FieldShell } from "./FieldShell";

type Props = {
  error?: string;
  formationKey: string;
  formationTemplates: FormationTemplate[];
  onChange: (patch: MatchInfoPatch) => void;
};

export function FormationField({
  error,
  formationKey,
  formationTemplates,
  onChange,
}: Props) {
  return (
    <FieldShell error={error} label="포메이션">
      <span className="relative block">
        <select
          id="match-formation"
          value={formationKey}
          onChange={(event) => onChange({ formationKey: event.target.value })}
          className={`${FIELD_CONTROL_CLASS} bg-card appearance-none pr-10`}
        >
          {formationTemplates.map((preset) => (
            <option key={preset.key} value={preset.key}>
              {preset.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
        />
      </span>
    </FieldShell>
  );
}
