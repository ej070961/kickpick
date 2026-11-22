import type {
  EditorPlayer,
  EditorQuarter,
  AvailablePlayer,
} from "@/features/formation-editor/model/types";
import type {
  FormationQuarterRow,
  FormationSlotInsertRow,
  FormationSlotRow,
  InsertedSlotRow,
  MatchPlayerRow,
  QuarterRow,
  RegisteredPlayerRow,
} from "@/features/formation-editor/api/dbRows";
import type { ParticipantIdentity } from "@/entities/match";
import type {
  FormationPlayer,
  GeneratedQuarterFormation,
} from "@/features/formation-generate/model/types";

/**
 * 참가자 유형과 원본 ID를 DB의 roster/guest id 컬럼으로 분리합니다.
 */
export const splitParticipantIdentity = (
  participant: ParticipantIdentity | null,
) => {
  if (!participant) return { guestPlayerId: null, playerId: null };

  return participant.type === "guest"
    ? { guestPlayerId: participant.id, playerId: null }
    : { guestPlayerId: null, playerId: participant.id };
};

/**
 * 경기 참가자 row를 자동 배치 알고리즘이 사용하는 선수 모델로 변환합니다.
 */
export const toFormationPlayer = (
  row: MatchPlayerRow,
): FormationPlayer | null => {
  if (row.match_guest_players) {
    return {
      id: row.match_guest_players.id,
      mainPosition: row.match_guest_players.main_position,
      name: row.match_guest_players.name,
      playerNumber: row.match_guest_players.player_number,
      priorityRank: row.match_guest_players.priority_rank,
      subPositions: row.match_guest_players.sub_positions,
      type: "guest",
    };
  }

  if (!row.players) return null;

  return {
    id: row.players.id,
    mainPosition: row.players.main_position,
    name: row.players.name,
    playerNumber: row.players.player_number,
    priorityRank: row.players.priority_rank,
    subPositions: row.players.sub_positions,
    type: "general",
  };
};

/**
 * 경기 참가자 row를 편집기 클라이언트에서 사용하는 선수 모델로 변환합니다.
 */
export const toEditorPlayer = (row: MatchPlayerRow): EditorPlayer | null => {
  const player = toFormationPlayer(row);

  if (!player) return null;

  return {
    id: row.match_guest_players ? row.match_guest_players.id : row.players!.id,
    type: row.match_guest_players ? "guest" : "general",
    mainPosition: player.mainPosition,
    name: player.name,
    playerNumber: player.playerNumber,
    priorityRank: player.priorityRank,
    subPositions: player.subPositions,
  };
};

/**
 * 등록 선수 row를 경기 편집기에서 추가 가능한 후보 선수 모델로 변환합니다.
 */
export const toAvailablePlayer = (
  row: RegisteredPlayerRow,
): AvailablePlayer => {
  return {
    id: row.id,
    type: "general",
    mainPosition: row.main_position,
    name: row.name,
    playerNumber: row.player_number,
    priorityRank: row.priority_rank,
    subPositions: row.sub_positions,
  };
};

/**
 * 생성된 도메인 슬롯을 formation_slots insert row로 변환합니다.
 */
export const createFormationSlotRows = ({
  formations,
  quarterFormationIdByNumber,
  playerTypeById,
}: {
  formations: GeneratedQuarterFormation[];
  quarterFormationIdByNumber: Map<number, string>;
  playerTypeById: Record<string, ParticipantIdentity["type"]>;
}): FormationSlotInsertRow[] => {
  return formations.flatMap((formationItem) => {
    const quarterFormationId = quarterFormationIdByNumber.get(
      formationItem.quarterNumber,
    );

    if (!quarterFormationId) return [];

    return formationItem.slots.map((slot) => {
      const type = slot.playerId ? playerTypeById[slot.playerId] : undefined;
      const { guestPlayerId, playerId } = splitParticipantIdentity(
        slot.playerId && type ? { id: slot.playerId, type } : null,
      );

      return {
        fit_score: slot.fitScore,
        guest_player_id: guestPlayerId,
        is_manual: slot.isManual,
        player_id: playerId,
        quarter_formation_id: quarterFormationId,
        slot_name: slot.name,
        x: slot.x,
        y: slot.y,
      };
    });
  });
};

/**
 * DB 슬롯 row를 편집기 클라이언트가 사용하는 슬롯 모델로 변환합니다.
 */
export const toEditorSlot = (
  row: FormationSlotRow | InsertedSlotRow,
): EditorQuarter["slots"][number] => {
  return {
    fitScore: row.fit_score,
    id: row.id,
    isManual: row.is_manual,
    name: row.slot_name,
    playerId: row.guest_player_id ?? row.player_id,
    x: Number(row.x),
    y: Number(row.y),
  };
};

export const toEditorQuarter = (row: FormationQuarterRow): EditorQuarter => {
  return {
    quarterNumber: row.quarter_number,
    slots: [...row.formation_slots]
      .sort((a, b) => Number(a.y) - Number(b.y))
      .map(toEditorSlot),
  };
};

export const toEditorQuarters = (
  rows: FormationQuarterRow[],
): EditorQuarter[] => {
  return rows.map(toEditorQuarter);
};

export const toInsertedEditorSlot = (
  row: InsertedSlotRow,
): EditorQuarter["slots"][number] => {
  return toEditorSlot(row);
};

/**
 * 저장 직후 반환된 슬롯 row를 쿼터 단위 편집기 상태로 그룹핑합니다.
 */
export const toInsertedEditorQuarters = ({
  quarterNumberByFormationId,
  rows,
}: {
  quarterNumberByFormationId: Map<string, number>;
  rows: InsertedSlotRow[];
}): EditorQuarter[] => {
  const slotsByQuarterNumber = new Map<number, EditorQuarter["slots"]>();

  for (const row of rows) {
    const quarterNumber = quarterNumberByFormationId.get(
      row.quarter_formation_id,
    );
    if (!quarterNumber) continue;

    const slots = slotsByQuarterNumber.get(quarterNumber) ?? [];
    slots.push(toInsertedEditorSlot(row));
    slotsByQuarterNumber.set(quarterNumber, slots);
  }

  return [...slotsByQuarterNumber.entries()]
    .sort(([a], [b]) => a - b)
    .map(([quarterNumber, slots]) => ({
      quarterNumber,
      slots: slots.sort((a, b) => Number(a.y) - Number(b.y)),
    }));
};

/**
 * 기존 쿼터 row에서 재배정 시 보존할 선수 key 목록을 추출합니다.
 */
export const toPreserveQuarterInputs = (quarters: QuarterRow[]) => {
  return quarters.map((quarter) => ({
    playerIds: quarter.formation_slots
      .map((slot) =>
        slot.guest_player_id ? slot.guest_player_id : slot.player_id,
      )
      .filter((playerId): playerId is string => Boolean(playerId)),
    quarterNumber: quarter.quarter_number,
  }));
};
