import Link from "next/link";
import { GalleryVerticalEnd } from "lucide-react";
import type { Player } from "@/entities/player";
import { getFormationTemplates } from "@/entities/formation/api/formationTemplateQueries";
import { MatchCreateForm } from "@/features/match-create/ui/MatchCreateForm";
import { createClient } from "@/shared/api/supabase/server";
import { EmptyStatePanel, PageHeader, PageLayout } from "@/shared/ui";

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

export async function MatchNewPage() {
  const [players, formationTemplates] = await Promise.all([
    getPlayers(),
    getFormationTemplates(),
  ]);

  return (
    <PageLayout>
      <PageHeader
        title="새 경기 생성"
        description="경기 조건과 참가 명단을 정하고, 바로 수정 가능한 쿼터별 라인업을 만들어보세요."
      />
      {formationTemplates.length > 0 ? (
        <MatchCreateForm
          formationTemplates={formationTemplates}
          players={players}
        />
      ) : (
        <FormationTemplateRequiredState />
      )}
    </PageLayout>
  );
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

/**
 * 포메이션 템플릿이 없을 때 경기 생성을 막고 템플릿 생성 화면으로 안내합니다.
 */
function FormationTemplateRequiredState() {
  return (
    <EmptyStatePanel
      icon={<GalleryVerticalEnd size={22} />}
      title="포메이션 템플릿이 필요해요"
      description="경기를 만들려면 GK를 포함한 11개 슬롯 템플릿이 필요해요. 포메이션을 등록한 뒤 다시 진행해주세요."
      action={
        <Link
          href="/formations"
          className="bg-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition hover:brightness-110"
        >
          포메이션 만들기
        </Link>
      }
    />
  );
}
