"use client";

import { useMemo, useState } from "react";
import type { AvailablePlayer } from "@/features/formation-editor/model/types";
import { Badge, Button, TextField } from "@/shared/ui";
import { PlayerDisplayName } from "../PlayerDisplayName";

type Props = {
  availablePlayers: AvailablePlayer[];
  isLoading: boolean;
  isPending: boolean;
  loadError: string | null;
  onAdd: (playerId: string) => void;
  onRetry: () => void;
};

/** 추가 가능한 등록 선수를 검색하고 경기 명단에 추가합니다. */
export const AvailablePlayerPicker = ({
  availablePlayers,
  isLoading,
  isPending,
  loadError,
  onAdd,
  onRetry,
}: Props) => {
  const [search, setSearch] = useState("");
  const filteredPlayers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return availablePlayers;
    return availablePlayers.filter((player) =>
      `${player.name} ${player.playerNumber ?? ""} ${player.mainPosition}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [availablePlayers, search]);

  return (
    <section className="border-border bg-background rounded-lg border p-3">
      <p className="text-foreground text-sm font-semibold">등록 선수 추가</p>
      <TextField
        label="검색"
        placeholder="이름, 등번호, 포지션"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
        {isLoading ? (
          <p className="text-muted px-1 py-2 text-sm">
            등록 선수를 불러오는 중입니다.
          </p>
        ) : loadError ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-3">
            <p className="text-muted text-sm">{loadError}</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={onRetry}
              disabled={isPending}
            >
              다시 시도
            </Button>
          </div>
        ) : filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              className="border-border bg-card hover:border-primary hover:bg-mint-surface flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition"
              onClick={() => onAdd(player.id)}
              disabled={isPending}
            >
              <span className="min-w-0">
                <PlayerDisplayName
                  player={player}
                  className="text-foreground block truncate font-semibold"
                />
              </span>
              <Badge>{player.mainPosition}</Badge>
            </button>
          ))
        ) : (
          <p className="border-border text-muted rounded-lg border border-dashed px-3 py-3 text-sm">
            추가할 등록 선수가 없습니다.
          </p>
        )}
      </div>
    </section>
  );
};
