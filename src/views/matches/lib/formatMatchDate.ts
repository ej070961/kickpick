import type { MatchListItem } from "@/views/matches/model/types";

/**
 * 경기 날짜가 없으면 생성일을 한국 시간 기준 목록 표시용 날짜로 대체합니다.
 */
export function formatMatchDate(match: MatchListItem) {
  if (match.matchDate) return match.matchDate;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(match.createdAt));
}
