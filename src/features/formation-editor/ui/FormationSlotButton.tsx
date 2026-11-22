import Image from "next/image";
import type {
  EditorPlayer,
  EditorSlot,
} from "@/features/formation-editor/model/types";

type Props = {
  isSelected: boolean;
  player?: EditorPlayer;
  slot: EditorSlot;
  onClick: () => void;
};

/** 경기장 위에서 슬롯 위치와 배정 선수 정보를 표시하는 버튼입니다. */
export const FormationSlotButton = ({
  isSelected,
  player,
  slot,
  onClick,
}: Props) => {
  return (
    <button
      type="button"
      className={`absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition duration-150 ${
        isSelected ? "scale-110" : "hover:scale-105"
      }`}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      onClick={onClick}
      aria-label={`${slot.name} 슬롯`}
    >
      <span className="relative block">
        {isSelected && (
          <span className="bg-primary absolute top-0 left-1/2 z-10 size-2.5 -translate-x-1/2 -translate-y-2 rounded-full shadow-sm" />
        )}
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
          player?.playerNumber !== undefined && (
            <span className="absolute top-[calc(45%+1px)] left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm leading-none font-black text-white drop-shadow">
              {player.playerNumber}
            </span>
          )}
      </span>
      <span
        className={`mt-0.5 max-w-[5.25rem] truncate rounded px-1.5 py-0.5 text-[10px] leading-tight font-bold ${
          isSelected
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-black/45 text-white"
        }`}
      >
        {player?.name ?? "미배정"}
        {player?.type === "guest" && (
          <span className="font-medium"> ・ 게스트</span>
        )}
      </span>
    </button>
  );
};
