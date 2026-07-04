import type { AssignedSlot } from "@/entities/formation";
import type { PlayerPositionCode } from "@/entities/position";

export type MatchRow = {
  gk_fixed: boolean;
  id: string;
  quarter_count: number;
};

export type MatchPlayerRow = {
  is_reduced_quota: boolean;
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

export type QuarterSlotRow = {
  guest_player_id: string | null;
  player_id: string | null;
};

export type QuarterRow = {
  formation_slots: QuarterSlotRow[];
  id: string;
  quarter_number: number;
};

export type FormationSlotInsertRow = {
  fit_score: number | null;
  guest_player_id: string | null;
  is_manual: boolean;
  player_id: string | null;
  quarter_formation_id: string;
  slot_name: AssignedSlot["name"];
  x: number;
  y: number;
};

export type InsertedSlotRow = FormationSlotInsertRow & {
  id: string;
};
