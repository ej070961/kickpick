import type { AssignedSlot } from "@/entities/formation";
import type { PlayerPositionCode } from "@/entities/position";

export type MatchRow = {
  /** GK를 모든 쿼터에 고정했는지 여부입니다. */
  gk_fixed: boolean;
  /** 재배정 대상 경기 id입니다. */
  id: string;
  /** 생성된 쿼터 개수입니다. */
  quarter_count: number;
};

export type MatchPlayerRow = {
  /** 자동 배치에서 목표 출전 수를 줄인 참가자인지 여부입니다. */
  is_reduced_quota: boolean;
  /** 참가자가 경기 전용 게스트이면 채워지는 게스트 스냅샷입니다. */
  match_guest_players: {
    /** match_guest_players row id입니다. */
    id: string;
    /** 게스트의 주 포지션입니다. */
    main_position: PlayerPositionCode;
    /** 화면에 표시할 게스트 이름입니다. */
    name: string;
    /** 게스트 등번호입니다. */
    player_number: number | null;
    /** 자동 배치 우선순위입니다. */
    priority_rank: number;
    /** 게스트의 보조 포지션 목록입니다. */
    sub_positions: PlayerPositionCode[];
  } | null;
  /** 참가자가 팀 정식 선수이면 채워지는 선수 row입니다. */
  players: {
    /** players row id입니다. */
    id: string;
    /** 선수의 주 포지션입니다. */
    main_position: PlayerPositionCode;
    /** 화면에 표시할 선수 이름입니다. */
    name: string;
    /** 선수 등번호입니다. */
    player_number: number | null;
    /** 자동 배치 우선순위입니다. */
    priority_rank: number;
    /** 선수의 보조 포지션 목록입니다. */
    sub_positions: PlayerPositionCode[];
  } | null;
};

export type QuarterSlotRow = {
  /** 포지션 적합도 점수입니다. 조회 목적에 따라 생략될 수 있습니다. */
  fit_score?: number | null;
  /** 배정된 경기 전용 게스트 id입니다. */
  guest_player_id: string | null;
  /** formation_slots row id입니다. 조회 목적에 따라 생략될 수 있습니다. */
  id?: string;
  /** 사용자가 직접 변경한 슬롯인지 여부입니다. */
  is_manual?: boolean;
  /** 배정된 등록 선수 id입니다. */
  player_id: string | null;
  /** 소속 quarter_formations row id입니다. */
  quarter_formation_id?: string;
  /** 포메이션 슬롯 코드입니다. */
  slot_name?: AssignedSlot["name"];
  /** 축구장 위 가로 위치 퍼센트입니다. */
  x?: number;
  /** 축구장 위 세로 위치 퍼센트입니다. */
  y?: number;
};

export type QuarterRow = {
  /** 해당 쿼터의 슬롯 row 목록입니다. */
  formation_slots: QuarterSlotRow[];
  /** quarter_formations row id입니다. */
  id: string;
  /** 경기 안에서 표시되는 쿼터 번호입니다. */
  quarter_number: number;
};

export type FormationSlotInsertRow = {
  /** 저장할 포지션 적합도 점수입니다. */
  fit_score: number | null;
  /** 저장할 경기 전용 게스트 id입니다. */
  guest_player_id: string | null;
  /** 저장 직후 자동 배정 슬롯인지 사용자 변경 슬롯인지 나타냅니다. */
  is_manual: boolean;
  /** 저장할 등록 선수 id입니다. */
  player_id: string | null;
  /** 슬롯이 속할 quarter_formations row id입니다. */
  quarter_formation_id: string;
  /** 저장할 포메이션 슬롯 코드입니다. */
  slot_name: AssignedSlot["name"];
  /** 축구장 위 가로 위치 퍼센트입니다. */
  x: number;
  /** 축구장 위 세로 위치 퍼센트입니다. */
  y: number;
};

export type InsertedSlotRow = FormationSlotInsertRow & {
  /** insert 후 반환된 formation_slots row id입니다. */
  id: string;
};

export type RosterPlayerRow = {
  /** players row id입니다. */
  id: string;
  /** 선수의 주 포지션입니다. */
  main_position: PlayerPositionCode;
  /** 화면에 표시할 선수 이름입니다. */
  name: string;
  /** 선수 등번호입니다. */
  player_number: number | null;
  /** 자동 배치 우선순위입니다. */
  priority_rank: number;
  /** 선수의 보조 포지션 목록입니다. */
  sub_positions: PlayerPositionCode[];
};

export type MatchDetailRow = {
  /** 편집 대상 경기 id입니다. */
  id: string;
  /** 경기 생성 시 선택되어 복사된 포메이션 이름입니다. */
  formation: string;
  /** 경기 목록과 상세 화면에서 표시하는 경기 날짜입니다. */
  match_date: string | null;
  /** 사용자가 경기 목록과 상세 화면에서 보는 경기명입니다. */
  name: string | null;
  /** 생성된 쿼터 개수입니다. */
  quarter_count: number;
};

export type FormationSlotRow = {
  /** formation_slots row id입니다. 슬롯 저장 시 식별자로 사용합니다. */
  id: string;
  /** 포지션 적합도 점수입니다. 미배정 또는 직접 조정된 슬롯에서는 null일 수 있습니다. */
  fit_score: number | null;
  /** 배정된 경기 전용 게스트 id입니다. 등록 선수가 배정된 경우 null입니다. */
  guest_player_id: string | null;
  /** 사용자가 직접 변경한 슬롯인지 여부입니다. */
  is_manual: boolean;
  /** 배정된 등록 선수 id입니다. 게스트가 배정된 경우 null입니다. */
  player_id: string | null;
  /** 포메이션 슬롯 코드입니다. */
  slot_name: AssignedSlot["name"];
  /** 축구장 위 가로 위치 퍼센트입니다. */
  x: number;
  /** 축구장 위 세로 위치 퍼센트입니다. */
  y: number;
};

export type FormationQuarterRow = {
  /** 해당 쿼터의 슬롯 row 목록입니다. */
  formation_slots: FormationSlotRow[];
  /** 경기 안에서 표시되는 쿼터 번호입니다. */
  quarter_number: number;
};
