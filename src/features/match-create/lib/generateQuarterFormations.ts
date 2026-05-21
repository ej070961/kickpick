import type { AssignedSlot, FormationPreset } from "@/entities/formation";
import type { PositionCode } from "@/entities/position";
import { calculateFitScore } from "@/features/formation-generate/lib/calculateFitScore";
import { calculateTargetQuotas } from "@/features/formation-generate/lib/calculateTargetQuotas";

export type FormationPlayer = {
  id: string;
  mainPosition: PositionCode;
  name: string;
  priorityRank: number;
  subPositions: PositionCode[];
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

function boostFixedGkQuota(
  targetQuotas: Map<string, number>,
  players: FormationPlayer[],
  fixedGkId: string,
  quarterCount: number,
) {
  const currentGkQuota = targetQuotas.get(fixedGkId) ?? 0;
  const needed = quarterCount - currentGkQuota;

  if (needed <= 0) return targetQuotas;

  const adjusted = new Map(targetQuotas);
  adjusted.set(fixedGkId, quarterCount);

  let remainingReduction = needed;
  const donors = [...players]
    .filter((player) => player.id !== fixedGkId)
    .sort((a, b) => b.priorityRank - a.priorityRank);

  for (const donor of donors) {
    if (remainingReduction === 0) break;

    const quota = adjusted.get(donor.id) ?? 0;
    const reduction = Math.min(quota, remainingReduction);

    adjusted.set(donor.id, quota - reduction);
    remainingReduction -= reduction;
  }

  return adjusted;
}

function pickFixedGoalkeeper(players: FormationPlayer[]) {
  return [...players].sort((a, b) => {
    const aIsGk = a.mainPosition === "GK";
    const bIsGk = b.mainPosition === "GK";

    if (aIsGk !== bIsGk) return aIsGk ? -1 : 1;

    return a.priorityRank - b.priorityRank;
  })[0];
}

function pickPlayerForSlot({
  players,
  slotName,
  usedPlayerIds,
}: {
  players: FormationPlayer[];
  slotName: PositionCode;
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
  const baseTargetQuotas = calculateTargetQuotas({
    players: players.map((player) => ({
      id: player.id,
      priorityRank: player.priorityRank,
    })),
    quarterCount,
    reducedPlayerIds,
    slotsPerQuarter: preset.slots.length,
  });
  const targetQuotas =
    gkFixed && fixedGoalkeeper
      ? boostFixedGkQuota(
          baseTargetQuotas,
          players,
          fixedGoalkeeper.id,
          quarterCount,
        )
      : baseTargetQuotas;
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
