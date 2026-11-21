import type {
  EditorQuarter,
  EditorQuartersByNumber,
} from "@/features/formation-editor/model/types";

/** 쿼터 배열을 번호 기준 편집 상태로 바꾸고 초기 카드 ID를 부여합니다. */
export function toQuartersByNumber(
  quarters: EditorQuarter[],
): EditorQuartersByNumber {
  return Object.fromEntries(
    quarters.map((quarter) => [
      quarter.quarterNumber,
      { lineupId: quarter.quarterNumber, slots: quarter.slots },
    ]),
  );
}

/** 번호 키 쿼터 상태를 화면·저장용 번호순 배열로 변환합니다. */
export function toQuarterList(
  quartersByNumber: EditorQuartersByNumber,
): EditorQuarter[] {
  return Object.entries(quartersByNumber)
    .map(([quarterNumber, quarter]) => ({
      quarterNumber: Number(quarterNumber),
      slots: quarter.slots,
    }))
    .sort((first, second) => first.quarterNumber - second.quarterNumber);
}
