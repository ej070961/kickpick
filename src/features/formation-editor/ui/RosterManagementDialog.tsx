"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import {
  PLAYER_POSITION_CODES,
  type PlayerPositionCode,
} from "@/entities/position";
import type {
  EditorPlayer,
  GuestPlayerFormInput,
  RosterCandidate,
} from "@/features/formation-editor/model/types";
import { getIdFromPlayerKey } from "@/features/match-create/model/types";
import { Badge, Button, Dialog, SelectField, TextField } from "@/shared/ui";
import { PlayerDisplayName } from "./PlayerDisplayName";

type RosterManagementDialogProps = {
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onAddRosterPlayer: (playerId: string) => void;
  onRemoveParticipant: (player: EditorPlayer) => void;
  onSaveGuestPlayer: (input: GuestPlayerFormInput) => void;
  players: EditorPlayer[];
  rosterCandidates: RosterCandidate[];
};

type GuestFormState = {
  id?: string;
  mainPosition: PlayerPositionCode;
  name: string;
  playerNumberText: string;
  subPositions: Set<PlayerPositionCode>;
};

/**
 * 경기 참가 명단에서 팀 선수와 경기 전용 용병을 추가, 수정, 제거합니다.
 */
export function RosterManagementDialog({
  isOpen,
  isPending,
  onClose,
  onAddRosterPlayer,
  onRemoveParticipant,
  onSaveGuestPlayer,
  players,
  rosterCandidates,
}: RosterManagementDialogProps) {
  const [search, setSearch] = useState("");
  const [guestForm, setGuestForm] =
    useState<GuestFormState>(createEmptyGuestForm);
  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rosterCandidates;

    return rosterCandidates.filter((player) =>
      `${player.name} ${player.playerNumber ?? ""} ${player.mainPosition}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [rosterCandidates, search]);
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.priorityRank - b.priorityRank),
    [players],
  );
  const guestPlayers = sortedPlayers.filter((player) => player.isGuest);

  function submitGuest() {
    const name = guestForm.name.trim();
    if (!name) return;

    onSaveGuestPlayer({
      id: guestForm.id,
      mainPosition: guestForm.mainPosition,
      name,
      playerNumber:
        guestForm.playerNumberText.trim().length > 0
          ? Number(guestForm.playerNumberText)
          : null,
      subPositions: [...guestForm.subPositions],
    });
    setGuestForm(createEmptyGuestForm());
  }

  function startEditGuest(player: EditorPlayer) {
    setGuestForm({
      id: getIdFromPlayerKey(player.id),
      mainPosition: player.mainPosition,
      name: player.name,
      playerNumberText: player.playerNumber?.toString() ?? "",
      subPositions: new Set(player.subPositions),
    });
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="경기 명단"
      description={`참가 ${players.length}명 · 추가 가능 ${rosterCandidates.length}명 · 용병 ${guestPlayers.length}명`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-foreground text-sm font-semibold">현재 참가자</p>
          <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1">
            {sortedPlayers.map((player) => (
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
                    {player.playerNumber !== null ? (
                      <Badge variant="primary">#{player.playerNumber}</Badge>
                    ) : null}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1">
                  {player.isGuest ? (
                    <Button
                      aria-label={`${player.name} 용병 수정`}
                      onClick={() => startEditGuest(player)}
                      size="sm"
                      variant="ghost"
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </Button>
                  ) : null}
                  <Button
                    aria-label={`${player.name} 명단 제외`}
                    onClick={() => onRemoveParticipant(player)}
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
        </div>

        <div className="border-border bg-background rounded-lg border p-3">
          <p className="text-foreground text-sm font-semibold">팀 선수 추가</p>
          <TextField
            label="검색"
            placeholder="이름, 등번호, 포지션"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  className="border-border bg-card hover:border-primary hover:bg-mint-surface flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition"
                  onClick={() =>
                    onAddRosterPlayer(getIdFromPlayerKey(player.id))
                  }
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
                추가할 팀 선수가 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="border-border bg-background rounded-lg border p-3">
          <p className="text-foreground text-sm font-semibold">
            {guestForm.id ? "용병 수정" : "용병 추가"}
          </p>
          <div className="mt-3 grid gap-3">
            <TextField
              label="이름"
              value={guestForm.name}
              onChange={(event) =>
                setGuestForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <TextField
              label="등번호"
              inputMode="numeric"
              value={guestForm.playerNumberText}
              onChange={(event) =>
                setGuestForm((current) => ({
                  ...current,
                  playerNumberText: event.target.value.replace(/\D/g, ""),
                }))
              }
            />
            <SelectField
              label="주 포지션"
              value={guestForm.mainPosition}
              onChange={(event) =>
                setGuestForm((current) => ({
                  ...current,
                  mainPosition: event.target.value as PlayerPositionCode,
                }))
              }
            >
              {PLAYER_POSITION_CODES.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </SelectField>
            <div>
              <p className="text-foreground text-sm font-semibold">부 포지션</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLAYER_POSITION_CODES.filter(
                  (position) => position !== guestForm.mainPosition,
                ).map((position) => {
                  const checked = guestForm.subPositions.has(position);

                  return (
                    <label
                      key={position}
                      className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${
                        checked
                          ? "border-primary bg-mint-surface text-primary"
                          : "border-border bg-card text-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleGuestSubPosition(position)}
                        className="checkbox-primary"
                      />
                      {position}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {guestForm.id ? (
                <Button
                  variant="secondary"
                  onClick={() => setGuestForm(createEmptyGuestForm())}
                >
                  취소
                </Button>
              ) : null}
              <Button
                leftIcon={<UserPlus size={16} aria-hidden="true" />}
                onClick={submitGuest}
                disabled={isPending || guestForm.name.trim().length === 0}
              >
                {guestForm.id ? "용병 수정" : "용병 추가"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );

  function toggleGuestSubPosition(position: PlayerPositionCode) {
    setGuestForm((current) => {
      const next = new Set(current.subPositions);

      if (next.has(position)) {
        next.delete(position);
      } else {
        next.add(position);
      }

      return { ...current, subPositions: next };
    });
  }
}

function createEmptyGuestForm(): GuestFormState {
  return {
    mainPosition: "CM",
    name: "",
    playerNumberText: "",
    subPositions: new Set(),
  };
}
