import type {
  EditorQuarter,
  QuarterDraftItem,
  QuarterDraftMap,
} from "@/features/formation-editor/model/types";

/** 쿼터 배열을 번호 기준 편집 상태로 바꾸고 초기 카드 ID를 부여합니다. */
export const toQuartersByNumber = (
  quarters: EditorQuarter[],
): QuarterDraftMap => {
  return Object.fromEntries(
    quarters.map((quarter) => [
      quarter.quarterNumber,
      { lineupId: quarter.quarterNumber, slots: quarter.slots },
    ]),
  );
};

/** 번호 키 쿼터 상태를 화면·저장용 번호순 배열로 변환합니다. */
export const toQuarterList = (
  quartersByNumber: QuarterDraftMap,
): EditorQuarter[] => {
  return Object.entries(quartersByNumber)
    .map(([quarterNumber, quarter]) => ({
      quarterNumber: Number(quarterNumber),
      slots: quarter.slots,
    }))
    .sort((first, second) => first.quarterNumber - second.quarterNumber);
};

/** 쿼터 번호 키 상태를 카드 목록용 데이터로 변환합니다. */
export const toQuarterDraftList = (
  quartersByNumber: QuarterDraftMap,
): QuarterDraftItem[] => {
  return Object.entries(quartersByNumber)
    .map(([quarterNumber, quarter]) => ({
      quarterNumber: Number(quarterNumber),
      ...quarter,
    }))
    .sort((first, second) => first.quarterNumber - second.quarterNumber);
};
