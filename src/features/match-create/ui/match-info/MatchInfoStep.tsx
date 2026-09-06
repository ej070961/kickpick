import type { FormationTemplate } from "@/entities/formation";
import type { MatchCreateState } from "@/features/match-create/actions/matchCreateActions";
import type {
  MatchInfo,
  MatchInfoPatch,
} from "@/features/match-create/model/matchDraft";
import { MatchCreateStepPanel } from "../MatchCreateStepPanel";
import { FormationField } from "./FormationField";
import { GkFixedField } from "./GkFixedField";
import { MatchDateField } from "./MatchDateField";
import { MatchNameField } from "./MatchNameField";
import { QuarterCountField } from "./QuarterCountField";

type Props = {
  formationTemplates: FormationTemplate[];
  info: MatchInfo;
  onInfoChange: (patch: MatchInfoPatch) => void;
  state: MatchCreateState;
};

/**
 * 라인업 생성에 필요한 경기 조건만 입력받는 첫 단계다.
 *
 * 출전 조정이나 참가자 계산은 알지 않고, 입력 patch만 상위 draft 흐름으로 전달한다.
 */
export function MatchInfoStep({
  formationTemplates,
  info,
  onInfoChange,
  state,
}: Props) {
  const defaultMatchName = `${info.matchDate || "오늘"} 경기`;

  return (
    <MatchCreateStepPanel
      title="경기 정보"
      description="날짜, 쿼터 수, 포메이션처럼 라인업을 짜는 데 필요한 기본 조건을 정해요."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <MatchNameField
          defaultMatchName={defaultMatchName}
          error={state.errors?.name?.[0]}
          name={info.name}
          onChange={onInfoChange}
        />
        <MatchDateField
          error={state.errors?.matchDate?.[0]}
          matchDate={info.matchDate}
          onChange={onInfoChange}
        />
        <QuarterCountField
          error={state.errors?.quarterCount?.[0]}
          onChange={onInfoChange}
          quarterCount={info.quarterCount}
        />
        <FormationField
          error={state.errors?.formation?.[0]}
          formationKey={info.formationKey}
          formationTemplates={formationTemplates}
          onChange={onInfoChange}
        />
        <GkFixedField gkFixed={info.gkFixed} onChange={onInfoChange} />
      </div>
    </MatchCreateStepPanel>
  );
}
