import type {
  FormationSlotCode,
  PlayerPositionCode,
} from "@/entities/position";

export type EditorPlayer = {
  /** 편집기 내부 선수 key. player:{uuid} 또는 guest:{uuid} 형식이다. */
  id: string;
  /** 경기 전용 게스트이면 true입니다. */
  isGuest?: boolean;
  /** 자동 배치와 fit score 계산에 가장 먼저 사용하는 포지션입니다. */
  mainPosition: PlayerPositionCode;
  /** 화면에 표시할 선수 이름입니다. */
  name: string;
  /** 등번호입니다. 없으면 이름만 표시합니다. */
  playerNumber: number | null;
  /** 자동 배치 우선순위입니다. 낮을수록 먼저 고려합니다. */
  priorityRank: number;
  /** 보조 포지션 목록입니다. */
  subPositions: PlayerPositionCode[];
};

export type EditorSlot = {
  /** 포지션 적합도 점수입니다. 미배정이면 null일 수 있습니다. */
  fitScore: number | null;
  /** formation_slots row id입니다. */
  id: string;
  /** 사용자가 직접 변경한 슬롯인지 여부입니다. */
  isManual: boolean;
  /** 포메이션 슬롯 코드입니다. */
  name: FormationSlotCode;
  /** 배정된 편집기 내부 선수 key입니다. 미배정이면 null입니다. */
  playerId: string | null;
  /** 축구장 위 가로 위치 퍼센트입니다. */
  x: number;
  /** 축구장 위 세로 위치 퍼센트입니다. */
  y: number;
};

export type EditorQuarter = {
  /** 화면에 표시하고 탭 선택에 사용하는 쿼터 번호입니다. */
  quarterNumber: number;
  /** 해당 쿼터에 속한 11개 포메이션 슬롯입니다. */
  slots: EditorSlot[];
};

export type AssignmentSummaryItem = {
  /** 출전 쿼터를 요약할 선수입니다. */
  player: EditorPlayer;
  /** 선수가 배정된 쿼터 번호 목록입니다. */
  quarterNumbers: number[];
};

export type FormationEditorTemplate = {
  /** 포메이션 템플릿 id입니다. */
  id: string;
  /** 사용자에게 표시할 포메이션 이름입니다. */
  label: string;
};

export type FormationRegenerationMode = "full" | "preserve_players";

export type RosterCandidate = EditorPlayer & {
  /** 팀 정식 선수 후보이므로 항상 false입니다. */
  isGuest?: false;
};

export type GuestPlayerFormInput = {
  /** 기존 게스트 수정 시 사용하는 match_guest_players id입니다. */
  id?: string;
  /** 게스트의 주 포지션입니다. */
  mainPosition: PlayerPositionCode;
  /** 게스트 이름입니다. */
  name: string;
  /** 게스트 등번호입니다. */
  playerNumber: number | null;
  /** 게스트의 보조 포지션 목록입니다. */
  subPositions: PlayerPositionCode[];
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
  /** 포메이션 변경 dialog에서 선택 가능한 템플릿 목록입니다. */
  formationTemplates: FormationEditorTemplate[];
  /** 헤더, 저장, export에서 공통으로 사용하는 경기 정보입니다. */
  match: FormationEditorMatch;
  /** 경기 참가 선수와 게스트 목록입니다. */
  players: EditorPlayer[];
  /** 쿼터별 편집 슬롯 초기값입니다. */
  quarters: EditorQuarter[];
  /** 경기 명단에 추가할 수 있는 등록 선수 후보입니다. */
  rosterCandidates: RosterCandidate[];
};
