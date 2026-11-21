import type {
  AssignedSlot,
  FormationTemplate,
  QuarterFormation,
} from "@/entities/formation";
import type { MatchParticipantKey, RosterPlayerKey } from "@/entities/match";
import type { PlayerProfile } from "@/entities/player";

export type EditorPlayer = PlayerProfile & {
  /** 경기 명단 안에서 사용하는 등록 선수 또는 게스트 key입니다. */
  id: MatchParticipantKey;
  isGuest: boolean;
};

export type EditorSlot = Omit<AssignedSlot, "playerId"> & {
  /** DB 슬롯 row id로 저장과 React key에 사용합니다. */
  id: string;
  playerId: MatchParticipantKey | null;
};

export type EditorQuarter = Omit<QuarterFormation, "slots"> & {
  slots: EditorSlot[];
};

export type EditorQuarterEntry = {
  lineupId: number;
  slots: EditorSlot[];
};

export type EditorQuartersByNumber = Record<number, EditorQuarterEntry>;

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

export type FormationEditorTemplate = Pick<FormationTemplate, "id" | "label">;

export type FormationRegenerationMode = "full" | "preserve_players";

export type RosterCandidate = PlayerProfile & {
  /** 경기 명단에 추가할 수 있는 등록 선수 key입니다. */
  id: RosterPlayerKey;
  isGuest: false;
};

export type GuestPlayerFormInput = Pick<
  PlayerProfile,
  "mainPosition" | "name" | "playerNumber" | "subPositions"
> & {
  /** 기존 게스트 수정 시 사용하는 match_guest_players id입니다. */
  id?: string;
};

export type FormationEditorMatch = {
  /** PNG 파일명 생성에 사용할 경기명과 날짜 기반 문자열입니다. */
  exportFileBaseName: string;
  /** 현재 경기에 적용된 포메이션 이름입니다. */
  formationLabel: string;
  /** 편집 대상 경기 id입니다. */
  id: string;
  /** 경기 상세와 목록에 표시하는 경기 날짜입니다. */
  matchDate: string | null;
  /** 화면에 표시할 경기명입니다. */
  name: string;
  /** 생성된 쿼터 개수입니다. */
  quarterCount: number;
};

export type FormationEditorInitialProps = {
  formationTemplates: FormationEditorTemplate[];
  match: FormationEditorMatch;
  players: EditorPlayer[];
  quarters: EditorQuarter[];
  rosterCandidates: RosterCandidate[];
};
