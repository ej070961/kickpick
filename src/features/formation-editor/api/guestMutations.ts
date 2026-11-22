import type {
  EditorPlayer,
  EditorQuarter,
  GuestPlayerFormInput,
} from "@/features/formation-editor/model/types";
import {
  getEditorQuartersByMatch,
  getMatchParticipants,
} from "@/features/formation-editor/api/queries";
import { updateGuestAssignments } from "@/features/formation-editor/api/participantMutations";
import { createClient } from "@/shared/api/supabase/server";

/** 경기 게스트를 생성·수정하고 최신 배정 쿼터를 반환합니다. */
export const saveGuest = async ({
  guest,
  matchId,
}: {
  guest: GuestPlayerFormInput;
  matchId: string;
}): Promise<{
  message: string;
  player?: EditorPlayer;
  quarters?: EditorQuarter[];
  success?: boolean;
}> => {
  const supabase = await createClient();
  let guestId = guest.id;
  let priorityRank = 1;

  if (guestId) {
    const { data, error } = await supabase
      .from("match_guest_players")
      .update({
        main_position: guest.mainPosition,
        name: guest.name,
        player_number: guest.playerNumber,
        sub_positions: guest.subPositions,
      })
      .eq("id", guestId)
      .eq("match_id", matchId)
      .select("priority_rank")
      .single();

    if (error || !data) {
      return { message: "게스트 정보를 수정하지 못했습니다." };
    }

    priorityRank = data.priority_rank as number;
    await updateGuestAssignments({ guest, guestId, matchId });
  } else {
    priorityRank = await getNextGuestPriorityRank(matchId);
    const { data, error } = await supabase
      .from("match_guest_players")
      .insert({
        main_position: guest.mainPosition,
        match_id: matchId,
        name: guest.name,
        player_number: guest.playerNumber,
        priority_rank: priorityRank,
        sub_positions: guest.subPositions,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { message: "게스트 정보를 추가하지 못했습니다." };
    }

    guestId = data.id as string;
    const { error: participantError } = await supabase
      .from("match_players")
      .insert({
        guest_player_id: guestId,
        is_reduced_quota: false,
        match_id: matchId,
        target_quota: 0,
      });

    if (participantError) {
      return { message: "게스트를 경기 명단에 추가하지 못했습니다." };
    }
  }

  const quarterResult = await getEditorQuartersByMatch(matchId);
  if (!quarterResult.ok) return { message: quarterResult.error };

  return {
    message: guest.id
      ? "게스트 정보를 수정했습니다."
      : "게스트를 추가했습니다.",
    player: {
      id: guestId,
      type: "guest",
      mainPosition: guest.mainPosition,
      name: guest.name,
      playerNumber: guest.playerNumber,
      priorityRank,
      subPositions: guest.subPositions,
    },
    quarters: quarterResult.quarters,
    success: true,
  };
};

const getNextGuestPriorityRank = async (matchId: string) => {
  const participants = await getMatchParticipants(matchId);
  return Math.max(0, ...participants.map((player) => player.priorityRank)) + 1;
};
