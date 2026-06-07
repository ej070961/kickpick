import type { AssignedSlot, FormationPreset } from "@/entities/formation";
import type {
  FormationSlotCode,
  PlayerPositionCode,
} from "@/entities/position";
import { calculateFitScore } from "@/features/formation-generate/lib/calculateFitScore";
import { calculateTargetQuotas } from "@/features/formation-generate/lib/calculateTargetQuotas";
import {
  getQuotaPlayers,
  getQuotaSlotsPerQuarter,
  pickFixedGoalkeeper,
} from "@/features/match-create/model/quotaSelection";

export type FormationPlayer = {
  id: string;
  mainPosition: PlayerPositionCode;
  name: string;
  playerNumber: number | null;
  priorityRank: number;
  subPositions: PlayerPositionCode[];
};

type GenerateQuarterFormationsInput = {
  gkFixed: boolean;
  players: FormationPlayer[];
  preset: FormationPreset;
  quarterCount: number;
  reducedPlayerIds: string[];
};

export type GeneratedQuarterFormation = {
  quarterNumber: number;
  slots: AssignedSlot[];
};

type QuotaResult = {
  formations: GeneratedQuarterFormation[];
  targetQuotas: Map<string, number>;
};

/**
 * 한 슬롯에 들어갈 수 있는 후보 중 fit score와 우선순위가 가장 좋은 선수를 선택합니다.
 */
function pickPlayerForSlot({
  players,
  slotName,
  usedPlayerIds,
}: {
  players: FormationPlayer[];
  slotName: FormationSlotCode;
  usedPlayerIds: Set<string>;
}) {
  return players
    .filter((player) => !usedPlayerIds.has(player.id))
    .map((player) => ({
      player,
      fitScore: calculateFitScore({
        mainPosition: player.mainPosition,
        slotPosition: slotName,
        subPositions: player.subPositions,
      }),
    }))
    .sort((a, b) => {
      if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;

      return a.player.priorityRank - b.player.priorityRank;
    })[0];
}

/**
 * 한 쿼터에 출전할 선수 후보군을 남은 quota가 큰 순서로 구성합니다.
 */
function pickQuarterPlayers({
  fixedGoalkeeper,
  players,
  remainingQuotas,
  slotsPerQuarter,
}: {
  fixedGoalkeeper: FormationPlayer | null;
  players: FormationPlayer[];
  remainingQuotas: Map<string, number>;
  slotsPerQuarter: number;
}) {
  const selectedPlayers: FormationPlayer[] = [];

  if (fixedGoalkeeper) {
    selectedPlayers.push(fixedGoalkeeper);
  }

  const rest = [...players]
    .filter((player) => player.id !== fixedGoalkeeper?.id)
    .filter((player) => (remainingQuotas.get(player.id) ?? 0) > 0)
    .sort((a, b) => {
      const remainingDiff =
        (remainingQuotas.get(b.id) ?? 0) - (remainingQuotas.get(a.id) ?? 0);

      if (remainingDiff !== 0) return remainingDiff;

      return a.priorityRank - b.priorityRank;
    });

  selectedPlayers.push(...rest.slice(0, slotsPerQuarter - selectedPlayers.length));

  if (selectedPlayers.length < slotsPerQuarter) {
    throw new Error("모든 슬롯을 채울 수 없습니다.");
  }

  return selectedPlayers;
}

/**
 * 경기 생성 입력값을 받아 쿼터별 슬롯 배정과 선수별 목표 quota를 생성합니다.
 */
export function generateQuarterFormations({
  gkFixed,
  players,
  preset,
  quarterCount,
  reducedPlayerIds,
}: GenerateQuarterFormationsInput): QuotaResult {
  if (players.length < preset.slots.length) {
    throw new Error("포메이션 슬롯 수보다 참가 선수가 적습니다.");
  }

  const fixedGoalkeeper = gkFixed ? pickFixedGoalkeeper(players) : null;
  const { quotaPlayers } = getQuotaPlayers({
    gkFixed: Boolean(fixedGoalkeeper),
    players,
  });
  const quotaSlotsPerQuarter = getQuotaSlotsPerQuarter({
    gkFixed: Boolean(fixedGoalkeeper),
    slotsPerQuarter: preset.slots.length,
  });
  const targetQuotas = calculateTargetQuotas({
    players: quotaPlayers.map((player) => ({
      id: player.id,
      priorityRank: player.priorityRank,
    })),
    quarterCount,
    reducedPlayerIds,
    slotsPerQuarter: quotaSlotsPerQuarter,
  });

  if (fixedGoalkeeper) {
    targetQuotas.set(fixedGoalkeeper.id, quarterCount);
  }

  const remainingQuotas = new Map(targetQuotas);
  const formations: GeneratedQuarterFormation[] = [];

  for (let quarterIndex = 0; quarterIndex < quarterCount; quarterIndex += 1) {
    const usedPlayerIds = new Set<string>();
    const slots: AssignedSlot[] = [];
    const quarterPlayers = pickQuarterPlayers({
      fixedGoalkeeper,
      players,
      remainingQuotas,
      slotsPerQuarter: preset.slots.length,
    });

    for (const slot of preset.slots) {
      if (gkFixed && fixedGoalkeeper && slot.name === "GK") {
        usedPlayerIds.add(fixedGoalkeeper.id);
        remainingQuotas.set(
          fixedGoalkeeper.id,
          (remainingQuotas.get(fixedGoalkeeper.id) ?? 0) - 1,
        );
        slots.push({
          ...slot,
          fitScore: calculateFitScore({
            mainPosition: fixedGoalkeeper.mainPosition,
            slotPosition: slot.name,
            subPositions: fixedGoalkeeper.subPositions,
          }),
          isManual: false,
          playerId: fixedGoalkeeper.id,
        });
        continue;
      }

      const assignment = pickPlayerForSlot({
        players: quarterPlayers,
        slotName: slot.name,
        usedPlayerIds,
      });

      if (!assignment) {
        throw new Error("모든 슬롯을 채울 수 없습니다.");
      }

      usedPlayerIds.add(assignment.player.id);
      remainingQuotas.set(
        assignment.player.id,
        (remainingQuotas.get(assignment.player.id) ?? 0) - 1,
      );
      slots.push({
        ...slot,
        fitScore: assignment.fitScore,
        isManual: false,
        playerId: assignment.player.id,
      });
    }

    formations.push({ quarterNumber: quarterIndex + 1, slots });
  }

  return { formations, targetQuotas };
}
