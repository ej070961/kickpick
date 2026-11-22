"use client";

import { useState } from "react";
import { PlusCircle, Users } from "lucide-react";
import type { Player } from "@/entities/player";
import { createPlayer } from "@/features/player-manage/actions/playerActions";
import { PlayerFormDialog } from "@/features/player-manage/ui/PlayerFormDialog";
import { PriorityBoard } from "@/features/priority-reorder/ui/PriorityBoard";
import { Button, EmptyStatePanel, PageHeader, PageLayout } from "@/shared/ui";

type Props = {
  players: Player[];
};

/** 선수 목록과 등록 UI를 조립하고 추가 모달 상태를 관리합니다. */
export function PlayersPageContent({ players }: Props) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  return (
    <PageLayout>
      <PageHeader
        title="선수 관리"
        description="경기 배치에 사용할 선수 정보와 순서를 정리하세요."
      />

      {players.length === 0 ? (
        <EmptyStatePanel
          icon={<Users size={22} />}
          title="아직 등록된 선수가 없어요"
          description="선수를 등록하면 경기 참가 명단에서 바로 선택할 수 있어요."
          action={
            <Button
              className="font-semibold"
              onClick={() => setIsCreateDialogOpen(true)}
              variant="dark"
            >
              선수 추가
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              className="shadow-sm"
              leftIcon={<PlusCircle size={18} aria-hidden="true" />}
              onClick={() => setIsCreateDialogOpen(true)}
            >
              선수 추가
            </Button>
          </div>
          <PriorityBoard players={players} />
        </>
      )}

      <PlayerFormDialog
        action={createPlayer}
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="선수 추가"
      />
    </PageLayout>
  );
}
