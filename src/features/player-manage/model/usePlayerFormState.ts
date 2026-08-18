"use client";

import { useActionState, useEffect, useState } from "react";
import type { Player } from "@/entities/player";
import type { PlayerPositionCode } from "@/entities/position";
import type { PlayerFormState } from "@/features/player-manage/actions/playerActions";

const initialState: PlayerFormState = {};

export type PlayerFormAction = (
  state: PlayerFormState,
  formData: FormData,
) => Promise<PlayerFormState>;

type Options = {
  action: PlayerFormAction;
  onSuccess: () => void;
  player?: Player;
};

/**
 * 선수 생성/수정 폼의 입력 상태와 주/부 포지션 연동 규칙을 관리합니다.
 */
export function usePlayerFormState({ action, onSuccess, player }: Options) {
  const [state, formAction] = useActionState(action, initialState);
  const [name, setName] = useState(player?.name ?? "");
  const [playerNumber, setPlayerNumber] = useState(
    player?.playerNumber?.toString() ?? "",
  );
  const [mainPosition, setMainPosition] = useState<PlayerPositionCode | "">(
    player?.mainPosition ?? "",
  );
  const [subPositions, setSubPositions] = useState<Set<PlayerPositionCode>>(
    () => new Set(player?.subPositions ?? []),
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (state.success) onSuccess();
  }, [onSuccess, state.success]);

  function handleMainPositionChange(value: PlayerPositionCode | "") {
    setMainPosition(value);
    if (!value) return;

    setSubPositions((current) => {
      if (!current.has(value)) return current;

      const next = new Set(current);
      next.delete(value);
      return next;
    });
  }

  function handleSubPositionChange(
    position: PlayerPositionCode,
    checked: boolean,
  ) {
    setSubPositions((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(position);
      } else {
        next.delete(position);
      }

      return next;
    });
  }

  return {
    canSubmit: name.trim().length > 0 && Boolean(mainPosition),
    formAction,
    mainPosition,
    name,
    playerNumber,
    search,
    setName,
    setPlayerNumber,
    setSearch,
    state,
    subPositions,
    handleMainPositionChange,
    handleSubPositionChange,
  };
}
