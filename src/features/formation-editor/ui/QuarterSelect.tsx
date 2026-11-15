import { SelectField } from "@/shared/ui";

type Props = {
  excludedQuarter: number | null;
  label: string;
  onChange: (quarter: number | null) => void;
  quarterNumbers: number[];
  value: number | null;
};

/** 반대쪽에서 이미 선택한 쿼터를 제외하는 공통 쿼터 선택 입력입니다. */
export function QuarterSelect({
  excludedQuarter,
  label,
  onChange,
  quarterNumbers,
  value,
}: Props) {
  return (
    <SelectField
      hideLabel
      label={label}
      onChange={({ target }) =>
        onChange(target.value === "" ? null : Number(target.value))
      }
      value={value ?? ""}
    >
      <option value="">선택</option>
      {quarterNumbers.map((quarter) => (
        <option
          disabled={quarter === excludedQuarter}
          key={quarter}
          value={quarter}
        >
          {quarter}Q
        </option>
      ))}
    </SelectField>
  );
}
