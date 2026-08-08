"use client";

import { useActionState } from "react";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { Player } from "@/entities/player";
import {
  PLAYER_POSITION_CODES,
  type PlayerPositionCode,
} from "@/entities/position";
import type { PlayerFormState } from "@/features/player-manage/actions/playerActions";
import { SubmitButton } from "./SubmitButton";

const initialState: PlayerFormState = {};

type PlayerFormAction = (
  state: PlayerFormState,
  formData: FormData,
) => Promise<PlayerFormState>;

type PlayerFormProps = {
  action: PlayerFormAction;
  mode: "create" | "edit";
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
export function PlayerForm({
  action,
  mode,
  onSuccess,
  player,
}: PlayerFormProps) {
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

  const filteredPositions = search
    ? PLAYER_POSITION_CODES.filter((position) =>
        position.toLowerCase().includes(search.toLowerCase()),
      )
    : PLAYER_POSITION_CODES;
  const submitLabel = mode === "create" ? "선수 추가" : "저장";
  const pendingLabel = mode === "create" ? "추가 중" : "저장 중";
  const canSubmit = name.trim().length > 0 && Boolean(mainPosition);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {player ? <input type="hidden" name="id" value={player.id} /> : null}

      <label className="block">
        <span className="text-foreground text-sm font-medium">선수 이름</span>
        <input
          name="name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="홍길동"
          className="border-border focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
        />
        {state.errors?.name ? (
          <span className="text-mismatch mt-1 block text-xs">
            {state.errors.name[0]}
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-foreground text-sm font-medium">
          선수 번호
          <span className="text-muted ml-1 font-normal">(선택)</span>
        </span>
        <input
          name="playerNumber"
          type="number"
          min={0}
          max={99}
          value={playerNumber}
          onChange={(event) => setPlayerNumber(event.target.value)}
          placeholder="예: 10"
          className="border-border focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
        />
        {state.errors?.playerNumber ? (
          <span className="text-mismatch mt-1 block text-xs">
            {state.errors.playerNumber[0]}
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-foreground text-sm font-medium">주 포지션</span>
        <select
          name="mainPosition"
          value={mainPosition}
          onChange={(event) =>
            handleMainPositionChange(
              event.target.value as PlayerPositionCode | "",
            )
          }
          className="border-border bg-card focus:border-primary mt-2 min-h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
        >
          {mode === "create" ? (
            <option value="" disabled>
              선택
            </option>
          ) : null}
          {PLAYER_POSITION_CODES.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
        {state.errors?.mainPosition ? (
          <span className="text-mismatch mt-1 block text-xs">
            {state.errors.mainPosition[0]}
          </span>
        ) : null}
      </label>

      <fieldset>
        <legend className="text-foreground text-sm font-medium">
          부 포지션
        </legend>
        <div className="relative mt-2">
          <Search
            size={15}
            aria-hidden="true"
            className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="포지션 검색"
            className="border-border focus:border-primary min-h-9 w-full rounded-lg border pr-3 pl-8 text-sm transition outline-none"
          />
        </div>
        <div className="border-border mt-2 flex max-h-52 flex-wrap gap-2 overflow-y-auto rounded-lg border p-3">
          {filteredPositions.length > 0 ? (
            filteredPositions.map((position) => {
              const disabled = position === mainPosition;
              const checked = subPositions.has(position) && !disabled;

              return (
                <label
                  key={position}
                  className={`border-border inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition select-none ${
                    disabled
                      ? "cursor-not-allowed opacity-40"
                      : "text-muted hover:border-primary hover:text-foreground cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="subPositions"
                    value={position}
                    disabled={disabled}
                    checked={checked}
                    onChange={(event) =>
                      handleSubPositionChange(position, event.target.checked)
                    }
                    className="checkbox-primary"
                  />
                  {position}
                </label>
              );
            })
          ) : (
            <span className="text-muted py-2 text-xs">검색 결과 없음</span>
          )}
        </div>
        {state.errors?.subPositions ? (
          <span className="text-mismatch mt-1 block text-xs">
            {state.errors.subPositions[0]}
          </span>
        ) : null}
      </fieldset>

      {state.message && !state.success ? (
        <p className="text-mismatch rounded-lg bg-orange-50 px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="bg-primary text-primary-foreground mt-2 min-h-11 w-full rounded-lg text-sm font-semibold disabled:opacity-60"
        disabled={!canSubmit}
        pendingLabel={pendingLabel}
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
