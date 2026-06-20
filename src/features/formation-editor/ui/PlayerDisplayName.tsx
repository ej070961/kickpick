import type { EditorPlayer } from "@/features/formation-editor/model/types";
import { formatPlayerName } from "@/features/formation-editor/lib/formationEditorFormat";

type PlayerDisplayNameProps = {
  className?: string;
  guestClassName?: string;
  player: EditorPlayer;
};

/**
 * 편집기 UI에서 선수명과 용병 여부를 같은 문구 규칙으로 표시합니다.
 */
export function PlayerDisplayName({
  className,
  guestClassName = "text-gray-500",
  player,
}: PlayerDisplayNameProps) {
  return (
    <span className={className}>
      {formatPlayerName(player)}
      {player.isGuest ? (
        <span className={`font-medium ${guestClassName}`}> ・ 용병</span>
      ) : null}
    </span>
  );
}
