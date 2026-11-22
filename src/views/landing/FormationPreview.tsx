import { FormationEditor } from "@/features/formation-editor/ui/FormationEditor";
import { EditorStoreProvider } from "@/features/formation-editor/model/store";
import type {
  EditorPlayer,
  EditorQuarter,
} from "@/features/formation-editor/model/types";
import { QuarterLineupSection } from "@/features/formation-editor/ui/QuarterLineupSection";
import { STARTER_FORMATION_TEMPLATES } from "@/entities/formation/config/starterTemplates";
import { DEFAULT_SLOT_COORDS } from "@/entities/formation/config/slotCoords";
import { getPlayerPositionForSlot } from "@/entities/position";
import { generateQuarterFormations } from "@/features/formation-generate/lib/generateQuarterFormations";

type LandingFieldPreviewProps = {
  className?: string;
};

/** 실제 경기 편집기를 예시 경기 데이터로 읽기 전용 렌더링합니다. */
export function FormationPreview() {
  return (
    <FormationEditor
      isReadOnly
      match={{
        id: "landing-preview",
        exportFileBaseName: "토요일 친선 경기",
        formationLabel: "4-3-3",
      }}
      players={players}
      quarters={quarters}
    />
  );
}

/** 첫 화면에서 편집기의 축구장 영역만 선명하게 렌더링합니다. */
export function LandingFieldPreview({
  className = "max-w-[400px]",
}: LandingFieldPreviewProps) {
  return (
    <EditorStoreProvider initialPlayers={players} initialQuarters={quarters}>
      <QuarterLineupSection
        className={className}
        exportRef={{ current: null }}
        isDisabled
      />
    </EditorStoreProvider>
  );
}

const playerNames = [
  "김민준",
  "박서준",
  "이도윤",
  "최지호",
  "정하준",
  "윤시우",
  "한도현",
  "임태오",
  "장우진",
  "신현우",
  "오준서",
  "강도현",
  "조현우",
];

const templateSlots = STARTER_FORMATION_TEMPLATES[1].slots;

const players: EditorPlayer[] = playerNames.map((name, index) => {
  const position = templateSlots[index % templateSlots.length];

  return {
    id: `landing-player-${index + 1}`,
    type: "general",
    name,
    playerNumber: index + 1,
    mainPosition: getPlayerPositionForSlot(position),
    subPositions: [],
    priorityRank: index + 1,
  };
});

const preset = {
  key: "landing-preview",
  label: "4-3-3",
  slots: templateSlots.map((name) => ({
    name,
    ...DEFAULT_SLOT_COORDS[name],
  })),
};

const generatedQuarters = generateQuarterFormations({
  gkFixed: false,
  players,
  preset,
  quarterCount: 4,
  reducedPlayerIds: [],
}).formations;

const quarters: EditorQuarter[] = generatedQuarters.map((quarter) => ({
  quarterNumber: quarter.quarterNumber,
  slots: quarter.slots.map((slot, slotIndex) => ({
    ...slot,
    id: `landing-quarter-${quarter.quarterNumber}-slot-${slotIndex + 1}`,
  })),
}));

export const landingAssignmentSummary = players.map((player) => ({
  id: player.id,
  displayName: `#${player.playerNumber} ${player.name}`,
  quarterNumbers: quarters
    .filter((quarter) =>
      quarter.slots.some((slot) => slot.playerId === player.id),
    )
    .map((quarter) => quarter.quarterNumber),
}));

export const landingBenchPlayers = players
  .filter(
    (player) => !quarters[0]?.slots.some((slot) => slot.playerId === player.id),
  )
  .map((player) => ({
    id: player.id,
    displayName: `#${player.playerNumber} ${player.name}`,
    position: player.mainPosition,
  }));
