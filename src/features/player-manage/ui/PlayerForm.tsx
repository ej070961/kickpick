"use client";

import type { Player } from "@/entities/player";
import type { PlayerFormAction } from "@/features/player-manage/model/usePlayerFormState";
import { usePlayerFormState } from "@/features/player-manage/model/usePlayerFormState";
import { PlayerBasicFields } from "./PlayerBasicFields";
import { PlayerPositionFields } from "./PlayerPositionFields";
import { SubmitButton } from "./SubmitButton";

type PlayerFormProps = {
  action: PlayerFormAction;
  onSuccess: () => void;
  player?: Player;
};

/**
 * 선수 생성과 수정을 함께 처리하는 공통 폼 컴포넌트입니다.
 *
 * 생성 모드에서는 빈 값을 입력받고, 수정 모드에서는 전달받은 선수 정보를
 * 초기값으로 사용합니다. 우선순위는 카드 드래그로만 관리하므로 이 폼에서는
 * 입력받지 않습니다.
 */
export function PlayerForm({ action, onSuccess, player }: PlayerFormProps) {
  const form = usePlayerFormState({ action, onSuccess, player });

  return (
    <form action={form.formAction} className="flex flex-col gap-4">
      {player ? <input type="hidden" name="id" value={player.id} /> : null}

      <PlayerBasicFields
        name={form.name}
        nameError={form.state.errors?.name?.[0]}
        onNameChange={form.setName}
        onPlayerNumberChange={form.setPlayerNumber}
        playerNumber={form.playerNumber}
        playerNumberError={form.state.errors?.playerNumber?.[0]}
      />

      <PlayerPositionFields
        mainPosition={form.mainPosition}
        mainPositionError={form.state.errors?.mainPosition?.[0]}
        onMainPositionChange={form.handleMainPositionChange}
        onSearchChange={form.setSearch}
        onSubPositionChange={form.handleSubPositionChange}
        search={form.search}
        subPositionError={form.state.errors?.subPositions?.[0]}
        subPositions={form.subPositions}
      />

      {form.state.message && !form.state.success ? (
        <p className="text-mismatch rounded-lg bg-orange-50 px-3 py-2 text-sm">
          {form.state.message}
        </p>
      ) : null}

      <SubmitButton
        className="mt-2 w-full"
        disabled={!form.canSubmit}
        pendingLabel="저장 중"
      >
        저장
      </SubmitButton>
    </form>
  );
}
