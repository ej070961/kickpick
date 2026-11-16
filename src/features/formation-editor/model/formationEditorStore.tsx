"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import {
  exchangeSlotAssignments,
  replaceSlotPlayer,
  scoreSlot,
  swapSlotPlayers,
  updateParticipantSlots,
} from "@/features/formation-editor/lib/formationEditorSlots";
import type {
  EditorPlayer,
  EditorQuarter,
  EditorSlot,
  QuarterSwapResult,
} from "@/features/formation-editor/model/types";

type EditorSelection =
  | { slotId: string; type: "slot" }
  | { playerId: EditorPlayer["id"]; type: "bench" }
  | null;

type FormationEditorStoreState = {
  players: EditorPlayer[];
  quarters: EditorQuarter[];
  activeQuarterNumber: number;
  selection: EditorSelection;
  hasUnsavedChanges: boolean;
  feedbackMessage: string | null;
};

type FormationEditorStoreActions = {
  selectQuarter: (quarterNumber: number) => void;
  handleSlotClick: (slotId: string) => void;
  handleBenchPlayerClick: (playerId: EditorPlayer["id"]) => void;
  swapQuarterAssignments: (
    firstQuarterNumber: number,
    secondQuarterNumber: number,
  ) => QuarterSwapResult;
  upsertPlayer: (player: EditorPlayer) => void;
  removeParticipantFromDraft: (playerId: string) => void;
  refreshGuestAssignments: (player: EditorPlayer) => void;
  applyRegeneratedQuarters: (quarters: EditorQuarter[]) => void;
  markSaved: () => void;
  setFeedbackMessage: (message: string | null) => void;
};

type FormationEditorStore = FormationEditorStoreState &
  FormationEditorStoreActions;

type FormationEditorInitialState = Pick<
  FormationEditorStoreState,
  "players" | "quarters"
>;

function createFormationEditorStore({
  players,
  quarters,
}: FormationEditorInitialState) {
  return createStore<FormationEditorStore>()((set, get) => {
    function updateActiveQuarter(
      updater: (slots: EditorSlot[]) => EditorSlot[],
    ) {
      set((state) => ({
        quarters: state.quarters.map((quarter) =>
          quarter.quarterNumber === state.activeQuarterNumber
            ? { ...quarter, slots: updater(quarter.slots) }
            : quarter,
        ),
        hasUnsavedChanges: true,
        feedbackMessage: null,
      }));
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
      quarters,
      activeQuarterNumber: quarters[0]?.quarterNumber ?? 1,
      selection: null,
      hasUnsavedChanges: false,
      feedbackMessage: null,

      selectQuarter: (quarterNumber) => {
        if (
          !get().quarters.some(
            (quarter) => quarter.quarterNumber === quarterNumber,
          )
        ) {
          return;
        }

        set({
          activeQuarterNumber: quarterNumber,
          selection: null,
          feedbackMessage: null,
        });
      },

      handleSlotClick: (slotId) => {
        const state = get();
        const activeQuarter = state.quarters.find(
          (quarter) => quarter.quarterNumber === state.activeQuarterNumber,
        );
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

      swapQuarterAssignments: (firstQuarterNumber, secondQuarterNumber) => {
        if (firstQuarterNumber === secondQuarterNumber) {
          return { ok: false, reason: "same_quarter" };
        }

        const state = get();
        const firstQuarter = state.quarters.find(
          (quarter) => quarter.quarterNumber === firstQuarterNumber,
        );
        const secondQuarter = state.quarters.find(
          (quarter) => quarter.quarterNumber === secondQuarterNumber,
        );

        if (!firstQuarter || !secondQuarter) {
          return { ok: false, reason: "quarter_not_found" };
        }

        const playerMap = new Map(
          state.players.map((player) => [player.id, player]),
        );
        const swapped = exchangeSlotAssignments({
          firstQuarterSlots: firstQuarter.slots,
          playerMap,
          secondQuarterSlots: secondQuarter.slots,
        });

        if (!swapped) return { ok: false, reason: "incompatible_positions" };

        set((current) => ({
          quarters: current.quarters.map((quarter) => {
            if (quarter.quarterNumber === firstQuarterNumber) {
              return { ...quarter, slots: swapped.firstQuarterSlots };
            }

            if (quarter.quarterNumber === secondQuarterNumber) {
              return { ...quarter, slots: swapped.secondQuarterSlots };
            }

            return quarter;
          }),
          hasUnsavedChanges: true,
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
          quarters: updateParticipantSlots(
            state.quarters,
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
          quarters: updateParticipantSlots(
            state.quarters,
            player.id,
            (slot) => {
              const fitScore = scoreSlot(slot.name, player);
              return fitScore === slot.fitScore ? slot : { ...slot, fitScore };
            },
          ),
        })),

      applyRegeneratedQuarters: (nextQuarters) =>
        set((state) => ({
          quarters: nextQuarters,
          hasUnsavedChanges: false,
          selection: null,
          activeQuarterNumber: nextQuarters.some(
            (quarter) => quarter.quarterNumber === state.activeQuarterNumber,
          )
            ? state.activeQuarterNumber
            : (nextQuarters[0]?.quarterNumber ?? 1),
        })),

      markSaved: () => set({ hasUnsavedChanges: false }),
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
