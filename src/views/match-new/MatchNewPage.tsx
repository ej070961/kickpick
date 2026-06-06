import type { Player } from "@/entities/player";
import { getFormationTemplates } from "@/features/formation-template-manage/lib/formationTemplateQueries";
import { MatchCreateForm } from "@/features/match-create/ui/MatchCreateForm";
import { createClient } from "@/shared/api/supabase/server";
import { PageHeader } from "@/shared/ui";

type PlayerRow = {
  id: string;
  team_id: string;
  name: string;
  player_number: number | null;
  main_position: Player["mainPosition"];
  sub_positions: Player["subPositions"];
  priority_rank: number;
  is_deleted: boolean;
  created_at: string;
};

function mapPlayer(row: PlayerRow): Player {
  return {
    createdAt: row.created_at,
    id: row.id,
    isDeleted: row.is_deleted,
    mainPosition: row.main_position,
    name: row.name,
    playerNumber: row.player_number,
    priorityRank: row.priority_rank,
    subPositions: row.sub_positions,
    teamId: row.team_id,
  };
}

async function getPlayers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select(
      "id, team_id, name, player_number, main_position, sub_positions, priority_rank, is_deleted, created_at",
    )
    .eq("is_deleted", false)
    .order("priority_rank", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapPlayer(row as PlayerRow));
}

export async function MatchNewPage() {
  const [players, formationTemplates] = await Promise.all([
    getPlayers(),
    getFormationTemplates(),
  ]);

  return (
    <section>
      <PageHeader
        title="새 경기 생성"
        description="참가 선수, 쿼터 수, GK 고정 여부, 포메이션을 선택하고 자동 배치 초안을 생성합니다."
      />
      <MatchCreateForm
        formationTemplates={formationTemplates}
        players={players}
      />
    </section>
  );
}
