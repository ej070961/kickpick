import type { Player } from "@/entities/player";
import { CreatePlayerModal } from "@/features/player-manage/ui/CreatePlayerModal";
import { PriorityBoard } from "@/features/priority-reorder/ui/PriorityBoard";
import { requireCurrentTeamId } from "@/entities/team";
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

/**
 * 선수 관리 페이지입니다.
 *
 * 선수 생성, 편집, 삭제와 우선순위 드래그 정렬을 한 화면에서 처리하도록
 * 서버에서 선수 목록을 불러와 관리 보드에 전달합니다.
 */
export async function PlayersPage() {
  const players = await getPlayers();
  const playerListVersion = players
    .map(
      (player) =>
        `${player.id}:${player.name}:${player.playerNumber ?? ""}:${player.mainPosition}:${player.subPositions.join(",")}:${player.priorityRank}`,
    )
    .join("|");

  return (
    <section>
      <PageHeader
        title="선수 관리"
        description="경기 배치에 사용할 선수 정보와 순서를 정리하세요."
      />

      <div className="-mt-4 mb-4 flex justify-end">
        <CreatePlayerModal />
      </div>

      <PriorityBoard key={playerListVersion} players={players} />
    </section>
  );
}

async function getPlayers() {
  const supabase = await createClient();
  const teamId = await requireCurrentTeamId();
  const { data, error } = await supabase
    .from("players")
    .select(
      "id, team_id, name, player_number, main_position, sub_positions, priority_rank, is_deleted, created_at",
    )
    .eq("team_id", teamId)
    .eq("is_deleted", false)
    .order("priority_rank", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapPlayer(row as PlayerRow));
}

function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    playerNumber: row.player_number,
    mainPosition: row.main_position,
    subPositions: row.sub_positions,
    priorityRank: row.priority_rank,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
  };
}
