type TargetQuotaPlayer = {
  id: string;
  priorityRank: number;
};

type CalculateTargetQuotasInput = {
  players: TargetQuotaPlayer[];
  quarterCount: number;
  slotsPerQuarter: number;
  reducedPlayerIds?: string[];
};

export function calculateTargetQuotas({
  players,
  quarterCount,
  slotsPerQuarter,
  reducedPlayerIds = [],
}: CalculateTargetQuotasInput) {
  const totalSlots = quarterCount * slotsPerQuarter;
  const baseQuota = Math.floor(totalSlots / players.length);
  const remainder = totalSlots % players.length;
  const reducedSet = new Set(reducedPlayerIds);
  const sortedPlayers = [...players].sort((a, b) => {
    if (reducedSet.has(a.id) !== reducedSet.has(b.id)) {
      return reducedSet.has(a.id) ? 1 : -1;
    }

    return a.priorityRank - b.priorityRank;
  });

  return new Map(
    sortedPlayers.map((player, index) => [
      player.id,
      baseQuota + (index < remainder ? 1 : 0),
    ]),
  );
}
