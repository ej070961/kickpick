import { createClient } from "@/shared/api/supabase/server";
import type {
  FormationSlotInsertRow,
  InsertedSlotRow,
  QuarterRow,
} from "./formationEditorRows";

/**
 * 경기 포메이션 이름을 최신 템플릿명으로 갱신합니다.
 */
export async function updateMatchFormationLabel({
  formationLabel,
  matchId,
}: {
  formationLabel: string;
  matchId: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({ formation: formationLabel })
    .eq("id", matchId);

  return error ? "경기 포메이션 정보를 갱신하지 못했습니다." : null;
}

/**
 * 기존 formation_slots를 삭제하고 재생성된 슬롯 row로 교체합니다.
 */
export async function replaceFormationSlots({
  quarters,
  slotRows,
}: {
  quarters: QuarterRow[];
  slotRows: FormationSlotInsertRow[];
}): Promise<
  { insertedSlots: InsertedSlotRow[]; ok: true } | { error: string; ok: false }
> {
  const supabase = await createClient();
  const quarterFormationIds = quarters.map((quarter) => quarter.id);
  const { error: deleteError } = await supabase
    .from("formation_slots")
    .delete()
    .in("quarter_formation_id", quarterFormationIds);

  if (deleteError) {
    return { error: "기존 포메이션 슬롯을 정리하지 못했습니다.", ok: false };
  }

  const { data: insertedSlots, error: insertError } = await supabase
    .from("formation_slots")
    .insert(slotRows)
    .select(
      "id, quarter_formation_id, slot_name, x, y, player_id, guest_player_id, fit_score, is_manual",
    );

  if (insertError || !insertedSlots) {
    return { error: "새 포메이션 슬롯을 저장하지 못했습니다.", ok: false };
  }

  return {
    insertedSlots: insertedSlots as unknown as InsertedSlotRow[],
    ok: true,
  };
}
