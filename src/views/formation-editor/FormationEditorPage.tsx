import type {
  EditorPlayer,
  EditorQuarter,
  EditorSlot,
  RosterCandidate,
} from "@/features/formation-editor/model/types";
import { FormationEditorClient } from "@/features/formation-editor/ui/FormationEditorClient";
import type { AssignedSlot } from "@/entities/formation";
import type { PlayerPositionCode } from "@/entities/position";
import type {
  MatchPlayerRow as SharedMatchPlayerRow,
  RosterPlayerRow,
} from "@/features/formation-editor/api/formationEditorRows";
import {
  mapMatchPlayerRowToEditorPlayer,
  mapRosterPlayerRowToCandidate,
} from "@/features/formation-editor/lib/formationEditorMappers";
import { getFormationTemplates } from "@/features/formation-template-manage/lib/formationTemplateQueries";
import {
  getGuestPlayerKey,
  getRosterPlayerKey,
} from "@/features/match-create/model/types";
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
  guest_player_id: string | null;
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
  match_guest_players: {
    id: string;
    main_position: PlayerPositionCode;
    name: string;
    player_number: number | null;
    priority_rank: number;
    sub_positions: PlayerPositionCode[];
  } | null;
  players: {
    id: string;
    main_position: PlayerPositionCode;
    name: string;
    player_number: number | null;
    priority_rank: number;
    sub_positions: PlayerPositionCode[];
  } | null;
};

async function getRosterPlayers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select(
      "id, name, player_number, main_position, sub_positions, priority_rank",
    )
    .eq("is_deleted", false)
    .order("priority_rank", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as RosterPlayerRow[];
}

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
      "quarter_number, formation_slots(id, slot_name, x, y, player_id, guest_player_id, fit_score, is_manual)",
    )
    .eq("match_id", matchId)
    .order("quarter_number", { ascending: true });

  if (quarterError) {
    throw new Error(quarterError.message);
  }

  const { data: matchPlayers, error: matchPlayersError } = await supabase
    .from("match_players")
    .select(
      "players(id, name, player_number, main_position, sub_positions, priority_rank), match_guest_players(id, name, player_number, main_position, sub_positions, priority_rank)",
    )
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
    playerId: row.guest_player_id
      ? getGuestPlayerKey(row.guest_player_id)
      : row.player_id
        ? getRosterPlayerKey(row.player_id)
        : null,
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

export async function FormationEditorPage({
  matchId,
}: FormationEditorPageProps) {
  const [{ match, players, quarters }, formationTemplates, rosterPlayers] =
    await Promise.all([
      getMatchFormation(matchId),
      getFormationTemplates(),
      getRosterPlayers(),
    ]);
  const displayName = match.name ?? "이름 없는 경기";
  const editorQuarters = quarters.map(mapQuarter);
  const editorPlayers = players
    .map((player) =>
      mapMatchPlayerRowToEditorPlayer(
        player as unknown as SharedMatchPlayerRow,
      ),
    )
    .filter((player): player is EditorPlayer => Boolean(player));
  const participantIds = new Set(editorPlayers.map((player) => player.id));
  const rosterCandidates: RosterCandidate[] = rosterPlayers
    .map(mapRosterPlayerRowToCandidate)
    .filter((player) => !participantIds.has(player.id));
  const fileBaseName = `${displayName}_${match.match_date ?? "formation"}`;

  return (
    <section>
      <PageHeader
        title={displayName}
        description={`${match.formation} / ${match.quarter_count}쿼터 자동 배치 초안입니다.`}
      />
      <FormationEditorClient
        fileBaseName={fileBaseName}
        formationLabel={match.formation}
        formationTemplates={formationTemplates.map((template) => ({
          id: template.id,
          label: template.label,
        }))}
        matchId={match.id}
        players={editorPlayers}
        quarters={editorQuarters}
        rosterCandidates={rosterCandidates}
      />
    </section>
  );
}
