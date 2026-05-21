"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { Download, Save } from "lucide-react";
import type { PositionCode } from "@/entities/position";
import { calculateFitScore } from "@/features/formation-generate/lib/calculateFitScore";
import { exportElementAsPng } from "@/features/formation-export/lib/exportElementAsPng";
import { saveFormationSlots } from "@/features/formation-editor/actions/formationEditorActions";

export type EditorPlayer = {
  id: string;
  mainPosition: PositionCode;
  name: string;
  subPositions: PositionCode[];
};

export type EditorSlot = {
  fitScore: number | null;
  id: string;
  isManual: boolean;
  name: PositionCode;
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

function fitClass(fitScore: number | null) {
  if (fitScore === 10) return "border-primary";
  if (fitScore === 5) return "border-warning";
  if (fitScore === 3) return "border-mismatch";

  return "border-border";
}

function scoreSlot(slotName: PositionCode, player: EditorPlayer | undefined) {
  if (!player) return null;

  return calculateFitScore({
    mainPosition: player.mainPosition,
    slotPosition: slotName,
    subPositions: player.subPositions,
  });
}

function slotAssetPath(slotName: PositionCode) {
  return `/images/${slotName}.svg`;
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9가-힣_-]+/g, "_")
    .replace(/_+/g, "_");
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
  const assignedPlayerIds = new Set(
    activeQuarter?.slots
      .map((slot) => slot.playerId)
      .filter((playerId): playerId is string => Boolean(playerId)) ?? [],
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

  function handleReplacePlayer(playerId: string) {
    if (!selectedSlot) return;

    const nextPlayerId = playerId || null;
    const player = nextPlayerId ? playerMap.get(nextPlayerId) : undefined;

    updateActiveQuarter((slots) =>
      slots.map((slot) => {
        if (slot.id === selectedSlot.id) {
          return {
            ...slot,
            fitScore: scoreSlot(slot.name, player),
            isManual: true,
            playerId: nextPlayerId,
          };
        }

        if (nextPlayerId && slot.playerId === nextPlayerId) {
          return {
            ...slot,
            fitScore: null,
            isManual: true,
            playerId: null,
          };
        }

        return slot;
      }),
    );
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

        <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-3 shadow-sm">
          <div ref={exportRef} className="relative overflow-hidden rounded-md">
            <Image
              src="/images/football-field.webp"
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
                  className={`absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl border-2 bg-white/90 px-1.5 py-1.5 text-center shadow-sm transition ${fitClass(slot.fitScore)} ${
                    isSelected ? "ring-4 ring-primary/30" : ""
                  }`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  onClick={() => handleSlotClick(slot)}
                  aria-label={`${slot.name} 슬롯`}
                >
                  <Image
                    src={slotAssetPath(slot.name)}
                    alt=""
                    width={48}
                    height={50}
                    className="h-12 w-12 object-contain"
                    draggable={false}
                    unoptimized
                  />
                  <span className="mt-1 max-w-full truncate text-[10px] font-bold leading-tight text-foreground">
                    {player?.name ?? "미배정"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-4 grid max-w-md gap-2 text-xs text-muted sm:grid-cols-2">
          <span className="rounded-lg border border-primary bg-card px-3 py-2">
            초록: 주 포지션
          </span>
          <span className="rounded-lg border border-warning bg-card px-3 py-2">
            노랑: 부 포지션
          </span>
          <span className="rounded-lg border border-mismatch bg-card px-3 py-2">
            주황: 같은 그룹
          </span>
          <span className="rounded-lg border border-border bg-card px-3 py-2">
            회색: 비선호
          </span>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">
            슬롯 편집
          </h3>
          <p className="mt-1 text-sm text-muted">
            슬롯을 하나 선택한 뒤 다른 슬롯을 누르면 서로 교체됩니다.
          </p>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-foreground">
              선택 슬롯 선수
            </span>
            <select
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
              value={selectedSlot?.playerId ?? ""}
              onChange={(event) => handleReplacePlayer(event.target.value)}
              disabled={!selectedSlot}
            >
              <option value="">미배정</option>
              {players.map((player) => (
                <option
                  key={player.id}
                  value={player.id}
                  disabled={
                    assignedPlayerIds.has(player.id) &&
                    player.id !== selectedSlot?.playerId
                  }
                >
                  {player.name} ({player.mainPosition})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">
            현재 쿼터 선수
          </h3>
          <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
            {activeQuarter.slots.map((slot) => {
              const player = slot.playerId
                ? playerMap.get(slot.playerId)
                : undefined;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm ${
                    selectedSlotId === slot.id
                      ? "border-primary bg-mint-surface"
                      : "border-border"
                  }`}
                >
                  <span className="font-semibold text-foreground">
                    {slot.name}
                  </span>
                  <span className="truncate text-muted">
                    {player?.name ?? "미배정"}
                  </span>
                </button>
              );
            })}
          </div>
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
  );
}
