export type MatchStatus = "draft" | "generated" | "completed";

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
