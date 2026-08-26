import type {
  EditorPlayer,
  EditorQuarter,
  RosterCandidate,
} from "@/features/formation-editor/model/types";
import type {
  FormationQuarterRow,
  FormationSlotInsertRow,
  FormationSlotRow,
  InsertedSlotRow,
  MatchPlayerRow,
  QuarterRow,
  RosterPlayerRow,
} from "@/features/formation-editor/api/formationEditorRows";
import type {
  FormationPlayer,
  GeneratedQuarterFormation,
} from "@/features/match-create/lib/generateQuarterFormations";
import {
  getGuestPlayerKey,
  getRosterPlayerKey,
} from "@/features/match-create/model/types";

/**
 * 편집기 내부 player key를 DB 저장용 roster/guest id 컬럼으로 분리합니다.
 */
export function splitPlayerKey(playerKey: string | null) {
  if (!playerKey) return { guestPlayerId: null, playerId: null };

  const [type, id] = playerKey.split(":");

  return type === "guest"
    ? { guestPlayerId: id, playerId: null }
    : { guestPlayerId: null, playerId: id };
}

/**
 * 경기 참가자 row를 자동 배치 알고리즘이 사용하는 선수 모델로 변환합니다.
 */
export function toFormationPlayer(row: MatchPlayerRow): FormationPlayer | null {
  if (row.match_guest_players) {
    return {
      id: getGuestPlayerKey(row.match_guest_players.id),
      mainPosition: row.match_guest_players.main_position,
      name: row.match_guest_players.name,
      playerNumber: row.match_guest_players.player_number,
      priorityRank: row.match_guest_players.priority_rank,
      subPositions: row.match_guest_players.sub_positions,
    };
  }

  if (!row.players) return null;

  return {
    id: getRosterPlayerKey(row.players.id),
    mainPosition: row.players.main_position,
    name: row.players.name,
    playerNumber: row.players.player_number,
    priorityRank: row.players.priority_rank,
    subPositions: row.players.sub_positions,
  };
}

/**
 * 경기 참가자 row를 편집기 클라이언트에서 사용하는 선수 모델로 변환합니다.
 */
export function toEditorPlayer(row: MatchPlayerRow): EditorPlayer | null {
  const player = toFormationPlayer(row);

  if (!player) return null;

  return {
    id: player.id,
    isGuest: Boolean(row.match_guest_players),
    mainPosition: player.mainPosition,
    name: player.name,
    playerNumber: player.playerNumber,
    priorityRank: player.priorityRank,
    subPositions: player.subPositions,
  };
}

/**
 * 등록 선수 row를 경기 편집기에서 추가 가능한 후보 선수 모델로 변환합니다.
 */
export function toRosterCandidate(row: RosterPlayerRow): RosterCandidate {
  return {
    id: getRosterPlayerKey(row.id),
    mainPosition: row.main_position,
    name: row.name,
    playerNumber: row.player_number,
    priorityRank: row.priority_rank,
    subPositions: row.sub_positions,
  };
}

/**
 * 생성된 도메인 슬롯을 formation_slots insert row로 변환합니다.
 */
export function createFormationSlotRows({
  formations,
  quarterFormationIdByNumber,
}: {
  formations: GeneratedQuarterFormation[];
  quarterFormationIdByNumber: Map<number, string>;
}): FormationSlotInsertRow[] {
  return formations.flatMap((formationItem) => {
    const quarterFormationId = quarterFormationIdByNumber.get(
      formationItem.quarterNumber,
    );

    if (!quarterFormationId) return [];

    return formationItem.slots.map((slot) => {
      const { guestPlayerId, playerId } = splitPlayerKey(slot.playerId);

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
}

/**
 * DB 슬롯 row를 편집기 클라이언트가 사용하는 슬롯 모델로 변환합니다.
 */
export function toEditorSlot(
  row: FormationSlotRow | InsertedSlotRow,
): EditorQuarter["slots"][number] {
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

export function toEditorQuarter(row: FormationQuarterRow): EditorQuarter {
  return {
    quarterNumber: row.quarter_number,
    slots: [...row.formation_slots]
      .sort((a, b) => Number(a.y) - Number(b.y))
      .map(toEditorSlot),
  };
}

export function toEditorQuarters(rows: FormationQuarterRow[]): EditorQuarter[] {
  return rows.map(toEditorQuarter);
}

export function toInsertedEditorSlot(
  row: InsertedSlotRow,
): EditorQuarter["slots"][number] {
  return toEditorSlot(row);
}

/**
 * 저장 직후 반환된 슬롯 row를 쿼터 단위 편집기 상태로 그룹핑합니다.
 */
export function toInsertedEditorQuarters({
  quarterNumberByFormationId,
  rows,
}: {
  quarterNumberByFormationId: Map<string, number>;
  rows: InsertedSlotRow[];
}): EditorQuarter[] {
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
}

/**
 * 기존 쿼터 row에서 재배정 시 보존할 선수 key 목록을 추출합니다.
 */
export function toPreserveQuarterInputs(quarters: QuarterRow[]) {
  return quarters.map((quarter) => ({
    playerIds: quarter.formation_slots
      .map((slot) =>
        slot.guest_player_id
          ? getGuestPlayerKey(slot.guest_player_id)
          : slot.player_id
            ? getRosterPlayerKey(slot.player_id)
            : null,
      )
      .filter((playerId): playerId is string => Boolean(playerId)),
    quarterNumber: quarter.quarter_number,
  }));
}
