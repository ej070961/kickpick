import Image from "next/image";
import type { RefObject } from "react";
import type {
  EditorPlayer,
  EditorQuarter,
  EditorSlot,
} from "@/features/formation-editor/model/types";

type FormationFieldProps = {
  exportRef: RefObject<HTMLDivElement | null>;
  onSlotClick: (slot: EditorSlot) => void;
  playerMap: Map<string, EditorPlayer>;
  quarter: EditorQuarter;
  selectedSlotId: string | null;
};

/**
 * 축구장 이미지 위에 쿼터 라벨과 선수 슬롯을 배치하는 편집 필드입니다.
 */
export function FormationField({
  exportRef,
  onSlotClick,
  playerMap,
  quarter,
  selectedSlotId,
}: FormationFieldProps) {
  return (
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
        <div
          className="pointer-events-none absolute left-3 top-3 z-20 flex items-end gap-1 rounded-md bg-black/70 px-3 py-2 text-white shadow-sm"
          aria-hidden="true"
        >
          <span className="text-2xl font-black leading-none">
            {quarter.quarterNumber}Q
          </span>
        </div>
        {quarter.slots.map((slot) => {
          const player = slot.playerId ? playerMap.get(slot.playerId) : undefined;
          const isSelected = selectedSlotId === slot.id;

          return (
            <button
              key={slot.id}
              type="button"
              className={`absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition duration-150 ${
                isSelected ? "scale-110" : "hover:scale-105"
              }`}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              onClick={() => onSlotClick(slot)}
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
                {player?.isGuest ? (
                  <span className="font-medium"> ・ 용병</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
