"use client";

import { ChevronDown, Search } from "lucide-react";
import {
  getPositionLabel,
  PLAYER_POSITION_CODES,
  type PlayerPositionCode,
} from "@/entities/position";
import { cn } from "@/shared/lib/cn";

type Props = {
  mainPosition: PlayerPositionCode | "";
  mainPositionError?: string;
  onMainPositionChange: (value: PlayerPositionCode | "") => void;
  onSearchChange: (value: string) => void;
  onSubPositionChange: (position: PlayerPositionCode, checked: boolean) => void;
  search: string;
  subPositionError?: string;
  subPositions: Set<PlayerPositionCode>;
};

/**
 * 선수의 주 포지션과 부 포지션 선택 UI를 렌더링합니다.
 */
export function PlayerPositionFields({
  mainPosition,
  mainPositionError,
  onMainPositionChange,
  onSearchChange,
  onSubPositionChange,
  search,
  subPositionError,
  subPositions,
}: Props) {
  const filteredPositions = getFilteredPositions(search);

  return (
    <>
      <MainPositionField
        error={mainPositionError}
        mainPosition={mainPosition}
        onMainPositionChange={onMainPositionChange}
      />
      <SubPositionsField
        error={subPositionError}
        filteredPositions={filteredPositions}
        mainPosition={mainPosition}
        onSearchChange={onSearchChange}
        onSubPositionChange={onSubPositionChange}
        search={search}
        subPositions={subPositions}
      />
    </>
  );
}

type MainPositionFieldProps = Pick<
  Props,
  "mainPosition" | "onMainPositionChange"
> & {
  error?: string;
};

function MainPositionField({
  error,
  mainPosition,
  onMainPositionChange,
}: MainPositionFieldProps) {
  return (
    <fieldset>
      <legend className="text-foreground text-sm font-medium">주 포지션</legend>
      <div className="relative mt-2">
        <select
          name="mainPosition"
          value={mainPosition}
          onChange={(event) =>
            onMainPositionChange(event.target.value as PlayerPositionCode | "")
          }
          className={cn(
            "border-border bg-card focus:border-primary min-h-11 w-full appearance-none rounded-lg border px-3 pr-10 text-sm font-semibold transition outline-none",
            mainPosition ? "text-foreground" : "text-muted",
          )}
        >
          <option value="" disabled>
            포지션 선택
          </option>
          {PLAYER_POSITION_CODES.map((position) => (
            <option key={position} value={position} className="text-foreground">
              {getPositionLabel(position).selectLabel}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
        />
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

type SubPositionsFieldProps = {
  error?: string;
  filteredPositions: PlayerPositionCode[];
  mainPosition: PlayerPositionCode | "";
  onSearchChange: Props["onSearchChange"];
  onSubPositionChange: Props["onSubPositionChange"];
  search: string;
  subPositions: Set<PlayerPositionCode>;
};

function SubPositionsField({
  error,
  filteredPositions,
  mainPosition,
  onSearchChange,
  onSubPositionChange,
  search,
  subPositions,
}: SubPositionsFieldProps) {
  return (
    <fieldset>
      <legend className="text-foreground text-sm font-medium">부 포지션</legend>
      <div className="relative mt-2">
        <Search
          size={15}
          aria-hidden="true"
          className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="포지션 검색"
          className="border-border focus:border-primary min-h-9 w-full rounded-lg border pr-3 pl-8 text-sm transition outline-none"
        />
      </div>
      <SubPositionList
        filteredPositions={filteredPositions}
        mainPosition={mainPosition}
        onSubPositionChange={onSubPositionChange}
        subPositions={subPositions}
      />
      <FieldError message={error} />
    </fieldset>
  );
}

type SubPositionListProps = Pick<
  SubPositionsFieldProps,
  "filteredPositions" | "mainPosition" | "onSubPositionChange" | "subPositions"
>;

function SubPositionList({
  filteredPositions,
  mainPosition,
  onSubPositionChange,
  subPositions,
}: SubPositionListProps) {
  const hasScrollableContent = filteredPositions.length > 5;

  return (
    <div
      className={cn(
        "relative mt-2",
        hasScrollableContent &&
          "after:from-card after:pointer-events-none after:absolute after:right-px after:bottom-px after:left-px after:h-7 after:rounded-b-lg after:bg-linear-to-t after:to-transparent",
      )}
    >
      <div className="border-border [scrollbar-color:theme(colors.border)_transparent] [&::-webkit-scrollbar-thumb]:bg-border h-56 [scrollbar-width:thin] [scrollbar-gutter:stable] overflow-y-auto rounded-lg border [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {filteredPositions.length > 0 ? (
          filteredPositions.map((position) => (
            <SubPositionRow
              key={position}
              checked={subPositions.has(position) && position !== mainPosition}
              disabled={position === mainPosition}
              onSubPositionChange={onSubPositionChange}
              position={position}
            />
          ))
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center">
            <span className="text-muted text-xs">
              일치하는 포지션이 없습니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

type SubPositionRowProps = {
  checked: boolean;
  disabled: boolean;
  onSubPositionChange: Props["onSubPositionChange"];
  position: PlayerPositionCode;
};

function SubPositionRow({
  checked,
  disabled,
  onSubPositionChange,
  position,
}: SubPositionRowProps) {
  const label = getPositionLabel(position);

  return (
    <label
      className={cn(
        "border-border flex min-h-11 items-center gap-3 border-b px-3 text-sm transition select-none last:border-b-0",
        checked && "bg-mint-surface text-primary",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "text-foreground hover:bg-surface/70 cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        name="subPositions"
        value={position}
        disabled={disabled}
        checked={checked}
        onChange={(event) =>
          onSubPositionChange(position, event.target.checked)
        }
        className="checkbox-primary"
      />
      <span className="text-foreground w-10 shrink-0 font-bold">
        {position}
      </span>
      <span className="text-muted min-w-0 truncate font-medium">
        {label.description}
      </span>
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <span className="text-mismatch mt-1 block text-xs">{message}</span>;
}

function getFilteredPositions(search: string) {
  const keyword = search.trim().toLowerCase();
  if (!keyword) return PLAYER_POSITION_CODES;

  return PLAYER_POSITION_CODES.filter((position) => {
    const label = getPositionLabel(position);

    return (
      position.toLowerCase().includes(keyword) ||
      label.description.toLowerCase().includes(keyword)
    );
  });
}
