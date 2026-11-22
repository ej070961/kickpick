import type { GuestPlayerFormInput } from "@/features/formation-editor/model/types";
import type {
  EditorQuarter,
  AvailablePlayer,
} from "@/features/formation-editor/model/types";
import type { RegisteredPlayerRow } from "@/features/formation-editor/api/dbRows";
import { toAvailablePlayer } from "@/features/formation-editor/api/mappers";
import { getEditorQuartersByMatch } from "@/features/formation-editor/api/queries";
import { calculateFitScore } from "@/features/formation-generate/lib/calculateFitScore";
import { splitParticipantIdentity } from "./mappers";
import type { ParticipantIdentity } from "@/entities/match";
import { createClient } from "@/shared/api/supabase/server";

/** 등록 선수를 경기 참가자로 추가하고 편집기 모델을 반환합니다. */
export const addRegisteredPlayer = async ({
  matchId,
  playerId,
}: {
  matchId: string;
  playerId: string;
}): Promise<{
  message: string;
  player?: AvailablePlayer;
  success: boolean;
}> => {
  const supabase = await createClient();
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select(
      "id, name, player_number, main_position, sub_positions, priority_rank",
    )
    .eq("id", playerId)
    .eq("is_deleted", false)
    .single();

  if (playerError || !player) {
    return { message: "추가할 선수를 불러오지 못했습니다.", success: false };
  }

  const { error } = await supabase.from("match_players").insert({
    is_reduced_quota: false,
    match_id: matchId,
    player_id: playerId,
    target_quota: 0,
  });

  if (error) {
    return {
      message: "선수를 경기 명단에 추가하지 못했습니다.",
      success: false,
    };
  }

  return {
    message: "선수를 경기 명단에 추가했습니다.",
    player: toAvailablePlayer(player as unknown as RegisteredPlayerRow),
    success: true,
  };
};

/** 참가자를 제거하고 서버에 저장된 배정 슬롯을 비운 뒤 최신 쿼터를 반환합니다. */
export const removeParticipant = async ({
  matchId,
  participant,
}: {
  matchId: string;
  participant: ParticipantIdentity;
}): Promise<
  | { message: string; ok: false }
  | { message: string; ok: true; quarters: EditorQuarter[] }
> => {
  const { guestPlayerId, playerId } = splitParticipantIdentity(participant);
  const participantId = guestPlayerId ?? playerId;

  if (!participantId) {
    return { message: "제거할 선수 정보가 올바르지 않습니다.", ok: false };
  }

  const clearResult = await clearParticipantSlots({ matchId, participant });
  if (!clearResult.success) {
    return {
      message: clearResult.message ?? "배정된 슬롯을 정리하지 못했습니다.",
      ok: false,
    };
  }

  const supabase = await createClient();
  let deleteQuery = supabase
    .from("match_players")
    .delete()
    .eq("match_id", matchId);
  deleteQuery = guestPlayerId
    ? deleteQuery.eq("guest_player_id", guestPlayerId)
    : deleteQuery.eq("player_id", playerId);

  const { error: participantError } = await deleteQuery;
  if (participantError) {
    return { message: "경기 명단에서 선수를 제거하지 못했습니다.", ok: false };
  }

  if (guestPlayerId) {
    const { error } = await supabase
      .from("match_guest_players")
      .delete()
      .eq("id", guestPlayerId)
      .eq("match_id", matchId);

    if (error)
      return { message: "게스트 정보를 삭제하지 못했습니다.", ok: false };
  }

  const quartersResult = await getEditorQuartersByMatch(matchId);
  if (!quartersResult.ok) {
    return { message: quartersResult.error, ok: false };
  }

  return {
    message: "경기 명단에서 제거했습니다.",
    ok: true,
    quarters: quartersResult.quarters,
  };
};

/** 참가자 제거 전에 해당 선수의 모든 경기 슬롯을 미배정 처리합니다. */
export const clearParticipantSlots = async ({
  matchId,
  participant,
}: {
  matchId: string;
  participant: ParticipantIdentity;
}) => {
  const supabase = await createClient();
  const { guestPlayerId, playerId } = splitParticipantIdentity(participant);
  const participantId = guestPlayerId ?? playerId;
  const slotColumn = guestPlayerId ? "guest_player_id" : "player_id";

  if (!participantId) {
    return { message: "제거할 선수 정보가 올바르지 않습니다.", success: false };
  }

  const { data: quarters, error: quarterError } = await supabase
    .from("quarter_formations")
    .select("id")
    .eq("match_id", matchId);

  if (quarterError || !quarters) {
    return { message: "쿼터 정보를 불러오지 못했습니다.", success: false };
  }

  const quarterIds = quarters.map((quarter) => quarter.id as string);
  if (quarterIds.length === 0) return { success: true };

  const { error } = await supabase
    .from("formation_slots")
    .update({
      fit_score: null,
      guest_player_id: null,
      is_manual: true,
      player_id: null,
    })
    .in("quarter_formation_id", quarterIds)
    .eq(slotColumn, participantId);

  if (error) {
    return { message: "배정된 슬롯을 정리하지 못했습니다.", success: false };
  }

  return { success: true };
};

/** 게스트 포지션 변경을 현재 배정 슬롯의 적합도에 반영합니다. */
export const updateGuestAssignments = async ({
  guest,
  guestId,
  matchId,
}: {
  guest: GuestPlayerFormInput;
  guestId: string;
  matchId: string;
}) => {
  const supabase = await createClient();
  const { data: quarters } = await supabase
    .from("quarter_formations")
    .select("id")
    .eq("match_id", matchId);
  const quarterIds = (quarters ?? []).map((quarter) => quarter.id as string);

  if (quarterIds.length === 0) return;

  const { data: slots } = await supabase
    .from("formation_slots")
    .select("id, slot_name")
    .in("quarter_formation_id", quarterIds)
    .eq("guest_player_id", guestId);

  await Promise.all(
    (slots ?? []).map((slot) =>
      supabase
        .from("formation_slots")
        .update({
          fit_score: calculateFitScore({
            mainPosition: guest.mainPosition,
            slotPosition: slot.slot_name,
            subPositions: guest.subPositions,
          }),
        })
        .eq("id", slot.id),
    ),
  );
};
