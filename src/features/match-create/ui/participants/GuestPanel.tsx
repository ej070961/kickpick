"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import type { GuestPlayerDraft } from "@/features/match-create/model/types";
import { Button } from "@/shared/ui";
import { GuestFormDialog } from "./GuestFormDialog";

type Props = {
  guestPlayers: GuestPlayerDraft[];
  nextPriorityRank: number;
  onAddGuestPlayer: (guest: GuestPlayerDraft) => void;
  onEditGuestPlayer: (guest: GuestPlayerDraft) => void;
  onRemoveGuestPlayer: (guestId: string) => void;
};

/**
 * 2단계 본문에서 게스트 목록과 게스트 추가/수정/삭제 액션을 제공한다.
 *
 * 목록은 본문에만 두고, dialog는 입력에만 집중시켜 같은 정보가 두 번 보이지 않게 한다.
 */
export function GuestPanel({
  guestPlayers,
  nextPriorityRank,
  onAddGuestPlayer,
  onEditGuestPlayer,
  onRemoveGuestPlayer,
}: Props) {
  const [editingGuest, setEditingGuest] = useState<GuestPlayerDraft>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const sortedGuests = useMemo(
    () => [...guestPlayers].sort((a, b) => a.priorityRank - b.priorityRank),
    [guestPlayers],
  );

  function openAddDialog() {
    setEditingGuest(undefined);
    setIsDialogOpen(true);
  }

  function openEditDialog(guest: GuestPlayerDraft) {
    setEditingGuest(guest);
    setIsDialogOpen(true);
  }

  function saveGuest(guest: GuestPlayerDraft) {
    if (editingGuest) {
      onEditGuestPlayer(guest);
    } else {
      onAddGuestPlayer(guest);
    }
  }

  return (
    <aside className="border-border bg-background rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-foreground text-sm font-semibold">게스트</p>
          <p className="text-muted mt-1 text-xs">
            등록 명단에 없는 선수만 추가해요.
          </p>
        </div>
        <Button
          type="button"
          onClick={openAddDialog}
          size="sm"
          className="shrink-0"
          leftIcon={<UserPlus size={16} aria-hidden="true" />}
        >
          추가
        </Button>
      </div>

      <GuestList
        guestPlayers={sortedGuests}
        onEditGuestPlayer={openEditDialog}
        onRemoveGuestPlayer={onRemoveGuestPlayer}
      />

      {isDialogOpen && (
        <GuestFormDialog
          key={editingGuest?.id ?? "new"}
          guest={editingGuest}
          nextPriorityRank={nextPriorityRank}
          onClose={() => setIsDialogOpen(false)}
          onSave={saveGuest}
        />
      )}
    </aside>
  );
}

function GuestList({
  guestPlayers,
  onEditGuestPlayer,
  onRemoveGuestPlayer,
}: {
  guestPlayers: GuestPlayerDraft[];
  onEditGuestPlayer: (guest: GuestPlayerDraft) => void;
  onRemoveGuestPlayer: (guestId: string) => void;
}) {
  if (guestPlayers.length === 0) {
    return (
      <p className="text-muted mt-3 text-sm">
        아직 추가한 게스트가 없습니다.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {guestPlayers.map((guest) => (
        <GuestListItem
          key={guest.id}
          guest={guest}
          onEdit={() => onEditGuestPlayer(guest)}
          onRemove={() => onRemoveGuestPlayer(guest.id)}
        />
      ))}
    </div>
  );
}

function GuestListItem({
  guest,
  onEdit,
  onRemove,
}: {
  guest: GuestPlayerDraft;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="border-border bg-card rounded-lg border px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold">
            {guest.name}
          </p>
          <p className="text-muted mt-1 text-xs">{guest.mainPosition}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`${guest.name} 수정`}
            className="text-muted hover:bg-mint-surface hover:text-foreground flex size-8 items-center justify-center rounded-lg transition"
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`${guest.name} 삭제`}
            className="text-muted hover:text-mismatch flex size-8 items-center justify-center rounded-lg transition hover:bg-orange-50"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
