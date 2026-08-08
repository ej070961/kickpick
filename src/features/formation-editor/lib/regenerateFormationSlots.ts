import type { AssignedSlot, FormationPreset } from "@/entities/formation";
import type { FormationSlotCode } from "@/entities/position";
import type {
  MatchRow,
  QuarterRow,
} from "@/features/formation-editor/api/formationEditorRows";
import { mapQuarterRowsToPreserveInputs } from "@/features/formation-editor/lib/formationEditorMappers";
import type { FormationRegenerationMode } from "@/features/formation-editor/model/types";
import { calculateFitScore } from "@/features/formation-generate/lib/calculateFitScore";
import { generateQuarterFormations as generateAllQuarterFormations } from "@/features/match-create/lib/generateQuarterFormations";
import type {
  FormationPlayer,
  GeneratedQuarterFormation,
} from "@/features/match-create/lib/generateQuarterFormations";

type PreserveQuarterInput = {
  quarterNumber: number;
  playerIds: string[];
};

type RegeneratePreservingPlayersInput = {
  players: FormationPlayer[];
  preset: FormationPreset;
  quarters: PreserveQuarterInput[];
};

type FitCandidate = {
  fitScore: number;
  player: FormationPlayer;
};

function getFitScore(player: FormationPlayer, slotName: FormationSlotCode) {
  return calculateFitScore({
    mainPosition: player.mainPosition,
    slotPosition: slotName,
    subPositions: player.subPositions,
  });
}

/**
 * 같은 쿼터에 이미 뛰던 선수들을 우선 보존하고, 부족한 인원은 우선순위로 채웁니다.
 */
function getQuarterPlayers({
  playerMap,
  playerIds,
  players,
  slotsPerQuarter,
}: {
  playerIds: string[];
  playerMap: Map<string, FormationPlayer>;
  players: FormationPlayer[];
  slotsPerQuarter: number;
}) {
  const selected: FormationPlayer[] = [];
  const usedPlayerIds = new Set<string>();

  for (const playerId of playerIds) {
    const player = playerMap.get(playerId);
    if (!player || usedPlayerIds.has(player.id)) continue;

    selected.push(player);
    usedPlayerIds.add(player.id);
  }

  if (selected.length >= slotsPerQuarter) {
    return selected.slice(0, slotsPerQuarter);
  }

  const benchPlayers = [...players]
    .filter((player) => !usedPlayerIds.has(player.id))
    .sort((a, b) => a.priorityRank - b.priorityRank);

  return [
    ...selected,
    ...benchPlayers.slice(0, slotsPerQuarter - selected.length),
  ];
}

/**
 * 선택된 선수들을 새 포메이션 슬롯에 fit score와 우선순위 기준으로 배치합니다.
 */
function assignPlayersToPresetSlots({
  players,
  preset,
}: {
  players: FormationPlayer[];
  preset: FormationPreset;
}): AssignedSlot[] {
  const usedPlayerIds = new Set<string>();

  return preset.slots.map((slot) => {
    let bestCandidate: FitCandidate | undefined;

    for (const player of players) {
      if (usedPlayerIds.has(player.id)) continue;

      const fitScore = getFitScore(player, slot.name);

      if (
        !bestCandidate ||
        fitScore > bestCandidate.fitScore ||
        (fitScore === bestCandidate.fitScore &&
          player.priorityRank < bestCandidate.player.priorityRank)
      ) {
        bestCandidate = { fitScore, player };
      }
    }

    if (!bestCandidate) {
      return {
        ...slot,
        fitScore: null,
        isManual: false,
        playerId: null,
      };
    }

    usedPlayerIds.add(bestCandidate.player.id);

    return {
      ...slot,
      fitScore: bestCandidate.fitScore,
      isManual: false,
      playerId: bestCandidate.player.id,
    };
  });
}

/**
 * 기존 쿼터별 출전 선수는 최대한 유지하고 새 포메이션 슬롯에 다시 배치합니다.
 */
export function regeneratePreservingQuarterPlayers({
  players,
  preset,
  quarters,
}: RegeneratePreservingPlayersInput): GeneratedQuarterFormation[] {
  const playerMap = new Map(players.map((player) => [player.id, player]));

  return quarters.map((quarter) => {
    const quarterPlayers = getQuarterPlayers({
      playerIds: quarter.playerIds,
      playerMap,
      players,
      slotsPerQuarter: preset.slots.length,
    });

    return {
      quarterNumber: quarter.quarterNumber,
      slots: assignPlayersToPresetSlots({ players: quarterPlayers, preset }),
    };
  });
}

type CreateRegeneratedFormationsInput = {
  match: MatchRow;
  mode: FormationRegenerationMode;
  players: FormationPlayer[];
  preset: FormationPreset;
  quarters: QuarterRow[];
  reducedPlayerIds: string[];
};

/**
 * 재배정 모드에 맞는 알고리즘을 선택해 새 쿼터별 포메이션을 생성합니다.
 */
export function createRegeneratedFormations({
  match,
  mode,
  players,
  preset,
  quarters,
  reducedPlayerIds,
}: CreateRegeneratedFormationsInput): GeneratedQuarterFormation[] {
  if (mode === "full") {
    return generateAllQuarterFormations({
      gkFixed: match.gk_fixed,
      players,
      preset,
      quarterCount: match.quarter_count,
      reducedPlayerIds,
    }).formations;
  }

  return regeneratePreservingQuarterPlayers({
    players,
    preset,
    quarters: mapQuarterRowsToPreserveInputs(quarters),
  });
}
