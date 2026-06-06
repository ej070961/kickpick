"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { Download, Save } from "lucide-react";
import type {
  FormationSlotCode,
  PlayerPositionCode,
} from "@/entities/position";
import { calculateFitScore } from "@/features/formation-generate/lib/calculateFitScore";
import { exportElementAsPng } from "@/features/formation-export/lib/exportElementAsPng";
import { saveFormationSlots } from "@/features/formation-editor/actions/formationEditorActions";

export type EditorPlayer = {
  id: string;
  mainPosition: PlayerPositionCode;
  name: string;
  playerNumber: number | null;
  subPositions: PlayerPositionCode[];
};

export type EditorSlot = {
  fitScore: number | null;
  id: string;
  isManual: boolean;
  name: FormationSlotCode;
  playerId: string | null;
  x: number;
  y: number;
};

export type EditorQuarter = {
  quarterNumber: number;
  slots: EditorSlot[];
};

type FormationEditorClientProps = {
  fileBaseName: string;
  matchId: string;
  players: EditorPlayer[];
  quarters: EditorQuarter[];
};

function scoreSlot(
  slotName: FormationSlotCode,
  player: EditorPlayer | undefined,
) {
  if (!player) return null;

  return calculateFitScore({
    mainPosition: player.mainPosition,
    slotPosition: slotName,
    subPositions: player.subPositions,
  });
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9가-힣_-]+/g, "_")
    .replace(/_+/g, "_");
}

function formatPlayerName(player: EditorPlayer) {
  return player.playerNumber !== null
    ? `#${player.playerNumber} ${player.name}`
    : player.name;
}

export function FormationEditorClient({
  fileBaseName,
  matchId,
  players,
  quarters,
}: FormationEditorClientProps) {
  const [editedQuarters, setEditedQuarters] = useState(quarters);
  const [activeQuarterNumber, setActiveQuarterNumber] = useState(
    quarters[0]?.quarterNumber ?? 1,
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const exportRef = useRef<HTMLDivElement>(null);
  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const activeQuarter =
    editedQuarters.find(
      (quarter) => quarter.quarterNumber === activeQuarterNumber,
    ) ?? editedQuarters[0];
  const selectedSlot = activeQuarter?.slots.find(
    (slot) => slot.id === selectedSlotId,
  );
  const selectedPlayer = selectedSlot?.playerId
    ? playerMap.get(selectedSlot.playerId)
    : undefined;
  const activeAssignedPlayerIds = useMemo(
    () =>
      new Set(
        activeQuarter?.slots
          .map((slot) => slot.playerId)
          .filter((playerId): playerId is string => Boolean(playerId)) ?? [],
      ),
    [activeQuarter],
  );
  const benchPlayers = useMemo(
    () =>
      players
        .filter((player) => !activeAssignedPlayerIds.has(player.id))
        .sort((a, b) => {
          const aNumber = a.playerNumber ?? Number.POSITIVE_INFINITY;
          const bNumber = b.playerNumber ?? Number.POSITIVE_INFINITY;

          if (aNumber !== bNumber) return aNumber - bNumber;

          return a.name.localeCompare(b.name);
        }),
    [activeAssignedPlayerIds, players],
  );
  const assignmentCounts = useMemo(
    () =>
      players
        .map((player) => ({
          count: editedQuarters.reduce(
            (total, quarter) =>
              total +
              quarter.slots.filter((slot) => slot.playerId === player.id)
                .length,
            0,
          ),
          player,
        }))
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;

          const aNumber = a.player.playerNumber ?? Number.POSITIVE_INFINITY;
          const bNumber = b.player.playerNumber ?? Number.POSITIVE_INFINITY;

          if (aNumber !== bNumber) return aNumber - bNumber;

          return a.player.name.localeCompare(b.player.name);
        }),
    [editedQuarters, players],
  );

  function updateActiveQuarter(updater: (slots: EditorSlot[]) => EditorSlot[]) {
    setEditedQuarters((current) =>
      current.map((quarter) =>
        quarter.quarterNumber === activeQuarterNumber
          ? { ...quarter, slots: updater(quarter.slots) }
          : quarter,
      ),
    );
    setMessage(null);
  }

  function handleSlotClick(slot: EditorSlot) {
    if (!selectedSlotId) {
      setSelectedSlotId(slot.id);
      return;
    }

    if (selectedSlotId === slot.id) {
      setSelectedSlotId(null);
      return;
    }

    updateActiveQuarter((slots) => {
      const source = slots.find((item) => item.id === selectedSlotId);
      const target = slots.find((item) => item.id === slot.id);

      if (!source || !target) return slots;

      return slots.map((item) => {
        if (item.id === source.id) {
          const player = target.playerId
            ? playerMap.get(target.playerId)
            : undefined;

          return {
            ...item,
            fitScore: scoreSlot(item.name, player),
            isManual: true,
            playerId: target.playerId,
          };
        }

        if (item.id === target.id) {
          const player = source.playerId
            ? playerMap.get(source.playerId)
            : undefined;

          return {
            ...item,
            fitScore: scoreSlot(item.name, player),
            isManual: true,
            playerId: source.playerId,
          };
        }

        return item;
      });
    });
    setSelectedSlotId(null);
  }

  function handleBenchPlayerClick(player: EditorPlayer) {
    if (!selectedSlotId) {
      setMessage("교체할 유니폼을 먼저 선택해주세요.");
      return;
    }

    updateActiveQuarter((slots) =>
      slots.map((slot) => {
        if (slot.id !== selectedSlotId) return slot;

        return {
          ...slot,
          fitScore: scoreSlot(slot.name, player),
          isManual: true,
          playerId: player.id,
        };
      }),
    );
    setSelectedSlotId(null);
  }

  function handleSave() {
    const slots = editedQuarters.flatMap((quarter) =>
      quarter.slots.map((slot) => ({
        fitScore: slot.fitScore,
        id: slot.id,
        isManual: slot.isManual,
        playerId: slot.playerId,
      })),
    );

    startTransition(async () => {
      const result = await saveFormationSlots(matchId, slots);
      setMessage(result.message);
    });
  }

  async function handleExport() {
    if (!exportRef.current || !activeQuarter) return;

    await exportElementAsPng({
      element: exportRef.current,
      fileName: `${sanitizeFileName(fileBaseName)}_${activeQuarter.quarterNumber}Q.png`,
    });
  }

  if (!activeQuarter) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted">
        생성된 포메이션이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              전체 배정 요약
            </h3>
            <p className="mt-1 text-sm text-muted">
              전체 쿼터 기준 선수별 배정 수입니다.
            </p>
          </div>
          <p className="text-sm font-semibold text-primary">
            {editedQuarters.length}쿼터 · {players.length}명
          </p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {assignmentCounts.map(({ count, player }) => (
            <div
              key={player.id}
              className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <span className="truncate font-semibold text-foreground">
                {formatPlayerName(player)}
              </span>
              <span className="shrink-0 rounded-md bg-mint-surface px-2 py-1 text-xs font-bold text-primary">
                {count}Q
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {editedQuarters.map((quarter) => (
              <button
                key={quarter.quarterNumber}
                type="button"
                onClick={() => {
                  setActiveQuarterNumber(quarter.quarterNumber);
                  setSelectedSlotId(null);
                }}
                className={`min-h-10 rounded-lg border px-3 text-sm font-semibold ${
                  quarter.quarterNumber === activeQuarter.quarterNumber
                    ? "border-primary bg-mint-surface text-primary"
                    : "border-border bg-card text-muted"
                }`}
              >
                {quarter.quarterNumber}Q
              </button>
            ))}
          </div>

          <div className="mx-auto max-w-md">
            <div ref={exportRef} className="relative overflow-hidden rounded-md">
              <Image
                src="/images/football-field.jpg"
                alt="축구장"
                width={626}
                height={913}
                className="h-auto w-full"
                priority
              />
              {activeQuarter.slots.map((slot) => {
                const player = slot.playerId
                  ? playerMap.get(slot.playerId)
                  : undefined;
                const isSelected = selectedSlotId === slot.id;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    className={`absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition duration-150 ${
                      isSelected ? "scale-110" : "hover:scale-105"
                    }`}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    onClick={() => handleSlotClick(slot)}
                    aria-label={`${slot.name} 슬롯`}
                  >
                    <span className="relative block">
                      {isSelected ? (
                        <span className="absolute left-1/2 top-0 z-10 size-2.5 -translate-x-1/2 -translate-y-2 rounded-full bg-primary shadow-sm" />
                      ) : null}
                      <Image
                        src="/images/uniform.svg"
                        alt=""
                        width={56}
                        height={58}
                        className="h-14 w-14 object-contain drop-shadow-sm"
                        draggable={false}
                        unoptimized
                      />
                      {player?.playerNumber !== null &&
                      player?.playerNumber !== undefined ? (
                        <span className="absolute left-1/2 top-[calc(45%+1px)] -translate-x-1/2 -translate-y-1/2 text-sm font-black leading-none text-white drop-shadow">
                          {player.playerNumber}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`mt-0.5 max-w-[5.25rem] truncate rounded px-1.5 py-0.5 text-[10px] font-bold leading-tight ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-black/45 text-white"
                      }`}
                    >
                      {player?.name ?? "미배정"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">
              현재 선택
            </h3>
            {selectedSlot ? (
              <div className="mt-3 rounded-lg border border-primary bg-mint-surface px-3 py-2">
                <p className="text-sm font-bold text-foreground">
                  {selectedSlot.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {selectedPlayer ? formatPlayerName(selectedPlayer) : "미배정"}
                </p>
                <p className="mt-2 text-xs text-muted">
                  다른 유니폼 또는 후보 카드를 누르면 교체됩니다.
                </p>
              </div>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted">
                유니폼을 선택하면 교체할 수 있습니다.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">
              현재 쿼터 후보
            </h3>
            <p className="mt-1 text-sm text-muted">
              {activeQuarter.quarterNumber}Q · 출전{" "}
              {activeAssignedPlayerIds.size}명 · 후보 {benchPlayers.length}명
            </p>
            <p className="mt-2 text-xs text-muted">
              {selectedSlot
                ? "후보 카드를 누르면 선택한 유니폼과 교체됩니다."
                : "유니폼을 먼저 선택한 뒤 후보를 누르세요."}
            </p>
            {benchPlayers.length > 0 ? (
              <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
                {benchPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => handleBenchPlayerClick(player)}
                    className="flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border border-border px-3 text-left text-sm transition hover:border-primary hover:bg-mint-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label={`${formatPlayerName(player)} 후보 선수 교체`}
                  >
                    <span className="truncate font-semibold text-foreground">
                      {formatPlayerName(player)}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-muted">
                      {player.mainPosition}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted">
                후보 선수가 없습니다.
              </p>
            )}
          </div>

          <div className="sticky bottom-0 rounded-lg border border-border bg-card p-4 shadow-sm">
            {message ? (
              <p className="mb-3 rounded-lg bg-mint-surface px-3 py-2 text-sm text-foreground">
                {message}
              </p>
            ) : null}
            <div className="grid gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Save size={18} aria-hidden="true" />
                {isPending ? "저장 중" : "저장"}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground"
              >
                <Download size={18} aria-hidden="true" />
                현재 쿼터 PNG
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
