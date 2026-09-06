import type { MatchInfoPatch } from "@/features/match-create/model/matchDraft";
import { FIELD_CONTROL_CLASS, FieldShell } from "./FieldShell";

type Props = {
  defaultMatchName: string;
  error?: string;
  name: string;
  onChange: (patch: MatchInfoPatch) => void;
};

export function MatchNameField({
  defaultMatchName,
  error,
  name,
  onChange,
}: Props) {
  return (
    <FieldShell
      error={error}
      label={
        <>
          경기명
          <span className="text-muted ml-1 font-normal">(선택)</span>
        </>
      }
      className="lg:col-span-2"
    >
      <input
        id="match-name"
        value={name}
        onChange={(event) => onChange({ name: event.target.value })}
        className={FIELD_CONTROL_CLASS}
        placeholder={defaultMatchName}
      />
    </FieldShell>
  );
}
