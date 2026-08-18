"use client";

import { TextField } from "@/shared/ui";

type Props = {
  name: string;
  nameError?: string;
  onNameChange: (value: string) => void;
  onPlayerNumberChange: (value: string) => void;
  playerNumber: string;
  playerNumberError?: string;
};

/**
 * 선수 이름과 등번호 입력 필드를 렌더링합니다.
 */
export function PlayerBasicFields({
  name,
  nameError,
  onNameChange,
  onPlayerNumberChange,
  playerNumber,
  playerNumberError,
}: Props) {
  return (
    <>
      <TextField
        name="name"
        autoFocus
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="홍길동"
        label="선수 이름"
        error={nameError}
      />

      <TextField
        name="playerNumber"
        type="number"
        min={0}
        max={99}
        value={playerNumber}
        onChange={(event) => onPlayerNumberChange(event.target.value)}
        placeholder="예: 10"
        label={
          <>
            선수 번호
            <span className="text-muted ml-1 font-normal">(선택)</span>
          </>
        }
        error={playerNumberError}
      />
    </>
  );
}
