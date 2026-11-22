"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { EditorPlayer } from "@/features/formation-editor/model/types";
import { Badge, Button } from "@/shared/ui";
import { PlayerDisplayName } from "../PlayerDisplayName";

type Props = {
  isPending: boolean;
  players: EditorPlayer[];
  onEditGuest: (player: EditorPlayer) => void;
  onRemove: (player: EditorPlayer) => void;
};

/** 현재 참가자 목록과 게스트 편집·제외 동작을 표시합니다. */
export const ParticipantsList = ({
  isPending,
  players,
  onEditGuest,
  onRemove,
}: Props) => (
  <section>
    <p className="text-foreground text-sm font-semibold">현재 참가자</p>
    <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1">
      {players.map((player) => (
        <div
          key={player.id}
          className="border-border bg-background flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2"
        >
          <span className="min-w-0">
            <PlayerDisplayName
              player={player}
              className="text-foreground block truncate text-sm font-semibold"
            />
            <span className="mt-1 flex flex-wrap gap-1">
              <Badge>{player.mainPosition}</Badge>
              {player.playerNumber !== null && (
                <Badge variant="primary">#{player.playerNumber}</Badge>
              )}
            </span>
          </span>
          <span className="flex shrink-0 gap-1">
            {player.type === "guest" && (
              <Button
                aria-label={`${player.name} 게스트 수정`}
                onClick={() => onEditGuest(player)}
                size="sm"
                variant="ghost"
              >
                <Pencil size={15} aria-hidden="true" />
              </Button>
            )}
            <Button
              aria-label={`${player.name} 명단 제외`}
              onClick={() => onRemove(player)}
              size="sm"
              variant="danger"
              disabled={isPending}
            >
              <Trash2 size={15} aria-hidden="true" />
            </Button>
          </span>
        </div>
      ))}
    </div>
  </section>
);
