import type {
  AssignedSlot,
  FormationTemplate,
  QuarterFormation,
} from "@/entities/formation";
import type { ParticipantIdentity } from "@/entities/match";
import type { PlayerProfile } from "@/entities/player";

export type EditorPlayer = PlayerProfile & ParticipantIdentity;

export type EditorSlot = Omit<AssignedSlot, "playerId"> & {
  /** DB 슬롯 row id로 저장과 React key에 사용합니다. */
  id: string;
  /** 배정된 선수의 원본 id입니다. 선수 정보는 store의 playersById에서 찾습니다. */
  playerId: string | null;
};

export type EditorQuarter = Omit<QuarterFormation, "slots"> & {
  slots: EditorSlot[];
};

export type QuarterDraft = {
  lineupId: number;
  slots: EditorSlot[];
};

export type QuarterDraftItem = QuarterDraft & {
  quarterNumber: number;
};

export type QuarterDraftMap = Record<number, QuarterDraft>;

/** 쿼터 간 선수 배정 작업 결과입니다. */
export type QuarterAssignmentResult =
  | { ok: true }
  | {
      ok: false;
      reason: "same_quarter" | "quarter_not_found" | "incompatible_positions";
    };

/** 선수별 출전 쿼터 요약 UI에서 사용하는 파생 표시 데이터입니다. */
export type AssignmentSummaryItem = {
  player: EditorPlayer;
  quarterNumbers: number[];
};

export type EditorTemplate = Pick<FormationTemplate, "id" | "label">;

export type FormationRegenerationMode = "full" | "preserve_players";

export type AvailablePlayer = PlayerProfile & {
  /** 경기 명단에 추가할 수 있는 등록 선수 id입니다. */
  id: string;
  type: "general";
};

export type GuestPlayerFormInput = Pick<
  PlayerProfile,
  "mainPosition" | "name" | "playerNumber" | "subPositions"
> & {
  /** 기존 게스트 수정 시 사용하는 match_guest_players id입니다. */
  id?: string;
};

export type EditorMatch = {
  /** PNG 파일명 생성에 사용할 경기명과 날짜 기반 문자열입니다. */
  exportFileBaseName: string;
  /** 현재 경기에 적용된 포메이션 이름입니다. */
  formationLabel: string;
  /** 편집 대상 경기 id입니다. */
  id: string;
};

export type EditorPageMatch = EditorMatch & {
  /** 화면에 표시할 경기명입니다. */
  name: string;
  /** 생성된 쿼터 개수입니다. */
  quarterCount: number;
};

export type EditorInitialData = {
  match: EditorPageMatch;
  players: EditorPlayer[];
  quarters: EditorQuarter[];
};

export type FormationEditorProps = Omit<EditorInitialData, "match"> & {
  match: EditorMatch;
};
