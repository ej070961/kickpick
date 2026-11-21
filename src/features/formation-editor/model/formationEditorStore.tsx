"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import {
  copySlotAssignments,
  replaceSlotPlayer,
  scoreSlot,
  swapSlotPlayers,
  updateParticipantSlots,
} from "@/features/formation-editor/lib/formationEditorSlots";
import { toQuartersByNumber } from "@/features/formation-editor/lib/formationEditorQuarters";
import type {
  EditorPlayer,
  EditorQuarter,
  EditorQuartersByNumber,
  EditorSlot,
  QuarterAssignmentResult,
} from "@/features/formation-editor/model/types";

type EditorSelection =
  | { slotId: string; type: "slot" }
  | { playerId: EditorPlayer["id"]; type: "bench" }
  | null;

type FormationEditorStoreState = {
  players: EditorPlayer[];
  quartersByNumber: EditorQuartersByNumber;
  selectedQuarter: number;
  selection: EditorSelection;
  feedbackMessage: string | null;
};

type FormationEditorStoreActions = {
  selectQuarter: (quarterNumber: number) => void;
  handleSlotClick: (slotId: string) => void;
  handleBenchPlayerClick: (playerId: EditorPlayer["id"]) => void;
  pasteQuarterAssignments: (
    targetQuarterNumber: number,
    sourceSlots: EditorSlot[],
  ) => QuarterAssignmentResult;
  swapQuarterAssignments: (
    sourceQuarterNumber: number,
    targetQuarterNumber: number,
  ) => QuarterAssignmentResult;
  upsertPlayer: (player: EditorPlayer) => void;
  removeParticipantFromDraft: (playerId: string) => void;
  refreshGuestAssignments: (player: EditorPlayer) => void;
  applyRegeneratedQuarters: (quarters: EditorQuarter[]) => void;
  setFeedbackMessage: (message: string | null) => void;
};

type FormationEditorStore = FormationEditorStoreState &
  FormationEditorStoreActions;

type FormationEditorInitialState = {
  players: EditorPlayer[];
  quarters: EditorQuarter[];
};

function createFormationEditorStore({
  players,
  quarters,
}: FormationEditorInitialState) {
  return createStore<FormationEditorStore>()((set, get) => {
    function updateActiveQuarter(
      updater: (slots: EditorSlot[]) => EditorSlot[],
    ) {
      set((state) => {
        const quarter = state.quartersByNumber[state.selectedQuarter];
        if (!quarter) return {};

        return {
          quartersByNumber: {
            ...state.quartersByNumber,
            [state.selectedQuarter]: {
              ...quarter,
              slots: updater(quarter.slots),
            },
          },
          feedbackMessage: null,
        };
      });
    }

    function clearSelection() {
      set({ selection: null, feedbackMessage: null });
    }

    function replaceSelectedSlotWithPlayer(
      playerId: EditorPlayer["id"],
      slotId: string,
    ) {
      const state = get();
      const player = state.players.find((item) => item.id === playerId);

      if (!player) return;

      updateActiveQuarter((slots) =>
        replaceSlotPlayer({ player, slots, slotId }),
      );
      clearSelection();
    }

    function swapSelectedSlots(targetSlotId: string, sourceSlotId: string) {
      const playerMap = new Map(
        get().players.map((player) => [player.id, player]),
      );

      updateActiveQuarter((slots) =>
        swapSlotPlayers({ playerMap, slots, sourceSlotId, targetSlotId }),
      );
      clearSelection();
    }

    return {
      players,
      quartersByNumber: toQuartersByNumber(quarters),
      selectedQuarter: quarters[0]?.quarterNumber ?? 1,
      selection: null,
      feedbackMessage: null,

      selectQuarter: (quarterNumber) => {
        if (!get().quartersByNumber[quarterNumber]) return;

        set({
          selectedQuarter: quarterNumber,
          selection: null,
          feedbackMessage: null,
        });
      },

      handleSlotClick: (slotId) => {
        const state = get();
        const activeQuarter = state.quartersByNumber[state.selectedQuarter];
        const targetSlot = activeQuarter?.slots.find(
          (slot) => slot.id === slotId,
        );

        if (!targetSlot) return;

        if (state.selection?.type === "bench") {
          replaceSelectedSlotWithPlayer(state.selection.playerId, slotId);
          return;
        }

        if (state.selection?.type !== "slot") {
          set({ selection: { slotId, type: "slot" }, feedbackMessage: null });
          return;
        }

        if (state.selection.slotId === slotId) {
          clearSelection();
          return;
        }

        swapSelectedSlots(slotId, state.selection.slotId);
      },

      handleBenchPlayerClick: (playerId) => {
        const state = get();

        if (!state.players.some((player) => player.id === playerId)) return;

        if (state.selection?.type === "slot") {
          replaceSelectedSlotWithPlayer(playerId, state.selection.slotId);
          return;
        }

        if (
          state.selection?.type === "bench" &&
          state.selection.playerId === playerId
        ) {
          clearSelection();
          return;
        }

        set({
          feedbackMessage: "교체할 유니폼을 선택해주세요.",
          selection: { playerId, type: "bench" },
        });
      },

      pasteQuarterAssignments: (targetQuarterNumber, sourceSlots) => {
        const state = get();
        const target = state.quartersByNumber[targetQuarterNumber];
        if (!target) return { ok: false, reason: "quarter_not_found" };
        const copiedSlots = copySlotAssignments({
          destinationSlots: target.slots,
          playerMap: new Map(
            state.players.map((player) => [player.id, player]),
          ),
          sourceSlots,
        });
        if (!copiedSlots)
          return { ok: false, reason: "incompatible_positions" };
        set((current) => ({
          quartersByNumber: {
            ...current.quartersByNumber,
            [targetQuarterNumber]: { ...target, slots: copiedSlots },
          },
          selection: null,
          feedbackMessage: null,
        }));
        return { ok: true };
      },

      swapQuarterAssignments: (sourceQuarterNumber, targetQuarterNumber) => {
        const state = get();
        if (sourceQuarterNumber === targetQuarterNumber) {
          return { ok: false, reason: "same_quarter" };
        }

        const source = state.quartersByNumber[sourceQuarterNumber];
        const target = state.quartersByNumber[targetQuarterNumber];
        if (!source || !target) {
          return { ok: false, reason: "quarter_not_found" };
        }

        const playerMap = new Map(
          state.players.map((player) => [player.id, player]),
        );
        const sourceSlots = copySlotAssignments({
          destinationSlots: source.slots,
          playerMap,
          sourceSlots: target.slots,
        });
        const targetSlots = copySlotAssignments({
          destinationSlots: target.slots,
          playerMap,
          sourceSlots: source.slots,
        });
        if (!sourceSlots || !targetSlots) {
          return { ok: false, reason: "incompatible_positions" };
        }

        set((current) => ({
          quartersByNumber: {
            ...current.quartersByNumber,
            [sourceQuarterNumber]: {
              lineupId: target.lineupId,
              slots: sourceSlots,
            },
            [targetQuarterNumber]: {
              lineupId: source.lineupId,
              slots: targetSlots,
            },
          },
          selection: null,
          feedbackMessage: null,
        }));
        return { ok: true };
      },

      upsertPlayer: (player) =>
        set((state) => ({
          players: state.players.some((item) => item.id === player.id)
            ? state.players.map((item) =>
                item.id === player.id ? player : item,
              )
            : [...state.players, player],
        })),

      removeParticipantFromDraft: (playerId) =>
        set((state) => ({
          players: state.players.filter((player) => player.id !== playerId),
          quartersByNumber: updateParticipantSlots(
            state.quartersByNumber,
            playerId,
            (slot) => ({
              ...slot,
              fitScore: null,
              isManual: true,
              playerId: null,
            }),
          ),
          selection:
            state.selection?.type === "bench" &&
            state.selection.playerId === playerId
              ? null
              : state.selection,
        })),

      refreshGuestAssignments: (player) =>
        set((state) => ({
          players: state.players.map((item) =>
            item.id === player.id ? player : item,
          ),
          quartersByNumber: updateParticipantSlots(
            state.quartersByNumber,
            player.id,
            (slot) => {
              const fitScore = scoreSlot(slot.name, player);
              return fitScore === slot.fitScore ? slot : { ...slot, fitScore };
            },
          ),
        })),

      applyRegeneratedQuarters: (nextQuarters) =>
        set((state) => {
          const quartersByNumber = toQuartersByNumber(nextQuarters);
          const selectedQuarter = quartersByNumber[state.selectedQuarter]
            ? state.selectedQuarter
            : (nextQuarters[0]?.quarterNumber ?? 1);

          return {
            quartersByNumber,
            selectedQuarter,
            selection: null,
          };
        }),

      setFeedbackMessage: (feedbackMessage) => set({ feedbackMessage }),
    };
  });
}

const FormationEditorStoreContext = createContext<
  StoreApi<FormationEditorStore> | undefined
>(undefined);

type ProviderProps = {
  children: ReactNode;
  initialPlayers: EditorPlayer[];
  initialQuarters: EditorQuarter[];
};

/** 화면별 편집 store를 생성해 자식 편집기 컴포넌트에 제공합니다. */
export function FormationEditorStoreProvider({
  children,
  initialPlayers,
  initialQuarters,
}: ProviderProps) {
  const [store] = useState(() =>
    createFormationEditorStore({
      players: initialPlayers,
      quarters: initialQuarters,
    }),
  );

  return (
    <FormationEditorStoreContext.Provider value={store}>
      {children}
    </FormationEditorStoreContext.Provider>
  );
}

/** Provider가 만든 편집 store에서 selector로 필요한 값만 구독합니다. */
export function useFormationEditorStore<T>(
  selector: (state: FormationEditorStore) => T,
) {
  const store = useContext(FormationEditorStoreContext);

  if (!store) {
    throw new Error(
      "useFormationEditorStore must be used within FormationEditorStoreProvider",
    );
  }

  return useStore(store, selector);
}
