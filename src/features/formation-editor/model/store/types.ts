import type {
  EditorPlayer,
  EditorQuarter,
  EditorSlot,
  QuarterAssignmentResult,
  QuarterDraftMap,
} from "@/features/formation-editor/model/types";

/** 필드 슬롯 또는 벤치 선수 중 현재 선택된 항목입니다. */
export type EditorSelection = {
  type: "slot" | "bench";
  id: string;
} | null;

/** 브라우저 store가 보관하는 경기별 편집 초안과 화면 상호작용 상태입니다. */
export type EditorStoreState = {
  /** 현재 경기 명단의 등록 선수와 게스트입니다. */
  playersById: Record<string, EditorPlayer>;
  /** 쿼터 번호를 key로 저장한 편집 배치입니다. */
  quartersByNumber: QuarterDraftMap;
  /** 필드에 표시하고 편집 중인 쿼터 번호입니다. */
  selectedQuarter: number;
  /** 슬롯·벤치 중 현재 선택된 항목입니다. */
  selection: EditorSelection;
  /** 편집 상호작용에서 표시할 일회성 안내 문구입니다. */
  feedbackMessage: string | null;
};

/** 편집 초안과 선택 상태를 갱신하는 store 명령의 타입입니다. */
export type EditorStoreActions = {
  /** 편집할 쿼터를 선택합니다. */
  selectQuarter: (quarterNumber: number) => void;
  /** 슬롯을 선택하고, 기존 선택이 있으면 교체·맞교환을 처리합니다. */
  selectSlot: (slotId: string) => void;
  /** 후보 선수를 선택하고, 기존 슬롯 선택이 있으면 배정합니다. */
  selectBenchPlayer: (playerId: EditorPlayer["id"]) => void;
  /** 한 쿼터의 슬롯 배정을 다른 쿼터에 복사합니다. */
  pasteQuarterAssignments: (
    targetQuarterNumber: number,
    sourceSlots: EditorSlot[],
  ) => QuarterAssignmentResult;
  /** 두 쿼터의 선수 배정을 맞바꿉니다. */
  swapQuarterAssignments: (
    sourceQuarterNumber: number,
    targetQuarterNumber: number,
  ) => QuarterAssignmentResult;
  /** 참가자 정보를 추가하거나 최신 정보로 갱신합니다. */
  upsertPlayer: (player: EditorPlayer) => void;
  /** 편집 초안에서 참가자를 제거하고 슬롯 배정을 비웁니다. */
  removeParticipantFromDraft: (playerId: string) => void;
  /** 게스트 정보 변경을 현재 슬롯 적합도에 반영합니다. */
  refreshGuestAssignments: (player: EditorPlayer) => void;
  /** 재배정 결과를 편집 초안에 적용합니다. */
  applyRegeneratedQuarters: (quarters: EditorQuarter[]) => void;
  /** 편집 영역의 일회성 안내 문구를 설정합니다. */
  setFeedbackMessage: (message: string | null) => void;
};

/** store 구독자가 사용하는 상태와 변경 명령을 합친 전체 계약입니다. */
export type EditorStore = EditorStoreState & EditorStoreActions;

/** 경기별 store를 처음 만들 때 서버에서 전달하는 선수와 쿼터 데이터입니다. */
export type EditorStoreInitialData = {
  players: EditorPlayer[];
  quarters: EditorQuarter[];
};
