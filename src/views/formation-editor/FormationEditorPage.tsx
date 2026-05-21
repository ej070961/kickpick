import type {
  EditorPlayer,
  EditorQuarter,
  EditorSlot,
} from "@/features/formation-editor/ui/FormationEditorClient";
import { FormationEditorClient } from "@/features/formation-editor/ui/FormationEditorClient";
import type { AssignedSlot } from "@/entities/formation";
import type { PositionCode } from "@/entities/position";
import { createClient } from "@/shared/api/supabase/server";
import { PageHeader } from "@/shared/ui";

type FormationEditorPageProps = {
  matchId: string;
};

type MatchRow = {
  formation: string;
  id: string;
  match_date: string | null;
  name: string | null;
  quarter_count: number;
};

type SlotRow = {
  fit_score: number | null;
  id: string;
  is_manual: boolean;
  player_id: string | null;
  slot_name: AssignedSlot["name"];
  x: number;
  y: number;
};

type QuarterRow = {
  formation_slots: SlotRow[];
  quarter_number: number;
};

type MatchPlayerRow = {
  players: {
    id: string;
    main_position: PositionCode;
    name: string;
    sub_positions: PositionCode[];
  } | null;
};

async function getMatchFormation(matchId: string) {
  const supabase = await createClient();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, name, match_date, quarter_count, formation")
    .eq("id", matchId)
    .single();

  if (matchError) {
    throw new Error(matchError.message);
  }

  const { data: quarters, error: quarterError } = await supabase
    .from("quarter_formations")
    .select(
      "quarter_number, formation_slots(id, slot_name, x, y, player_id, fit_score, is_manual)",
    )
    .eq("match_id", matchId)
    .order("quarter_number", { ascending: true });

  if (quarterError) {
    throw new Error(quarterError.message);
  }

  const { data: matchPlayers, error: matchPlayersError } = await supabase
    .from("match_players")
    .select("players(id, name, main_position, sub_positions)")
    .eq("match_id", matchId);

  if (matchPlayersError) {
    throw new Error(matchPlayersError.message);
  }

  return {
    match: match as MatchRow,
    players: (matchPlayers ?? []) as unknown as MatchPlayerRow[],
    quarters: (quarters ?? []) as unknown as QuarterRow[],
  };
}

function mapSlot(row: SlotRow): EditorSlot {
  return {
    fitScore: row.fit_score,
    id: row.id,
    isManual: row.is_manual,
    name: row.slot_name,
    playerId: row.player_id,
    x: Number(row.x),
    y: Number(row.y),
  };
}

function mapQuarter(row: QuarterRow): EditorQuarter {
  return {
    quarterNumber: row.quarter_number,
    slots: [...row.formation_slots]
      .sort((a, b) => Number(a.y) - Number(b.y))
      .map(mapSlot),
  };
}

function mapPlayer(row: MatchPlayerRow): EditorPlayer | null {
  if (!row.players) return null;

  return {
    id: row.players.id,
    mainPosition: row.players.main_position,
    name: row.players.name,
    subPositions: row.players.sub_positions,
  };
}

export async function FormationEditorPage({
  matchId,
}: FormationEditorPageProps) {
  const { match, players, quarters } = await getMatchFormation(matchId);
  const displayName = match.name ?? "이름 없는 경기";
  const editorQuarters = quarters.map(mapQuarter);
  const editorPlayers = players
    .map(mapPlayer)
    .filter((player): player is EditorPlayer => Boolean(player));
  const fileBaseName = `${displayName}_${match.match_date ?? "formation"}`;

  return (
    <section>
      <PageHeader
        title={displayName}
        description={`${match.formation} / ${match.quarter_count}쿼터 자동 배치 초안입니다.`}
      />
      <FormationEditorClient
        fileBaseName={fileBaseName}
        matchId={match.id}
        players={editorPlayers}
        quarters={editorQuarters}
      />
    </section>
  );
}
