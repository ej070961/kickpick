export type MatchStatus = "draft" | "generated" | "completed";

/** 원본 선수 ID와 경기 참가자 유형을 함께 나타내는 식별 정보입니다. */
export type ParticipantIdentity = {
  id: string;
  type: "general" | "guest";
};

export type Match = {
  id: string;
  teamId: string;
  name: string | null;
  matchDate: string | null;
  quarterCount: number;
  gkFixed: boolean;
  formation: string;
  status: MatchStatus;
  createdAt: string;
};
