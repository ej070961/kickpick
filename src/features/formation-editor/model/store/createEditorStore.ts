import { createStore } from "zustand/vanilla";
import {
  copySlotAssignments,
  replaceSlotPlayer,
  scoreSlot,
  swapSlotPlayers,
  updateParticipantSlots,
} from "@/features/formation-editor/lib/slotAssignments";
import { toQuartersByNumber } from "@/features/formation-editor/lib/quarterDraft";
import type {
  EditorPlayer,
  EditorSlot,
} from "@/features/formation-editor/model/types";
import type { EditorStore, EditorStoreInitialData } from "./types";

/** 경기 단위 편집 초안과 상호작용을 위한 독립 store를 생성합니다. */
export const createEditorStore = ({
  players,
  quarters,
}: EditorStoreInitialData) =>
  createStore<EditorStore>()((set, get) => {
    const updateActiveQuarter = (
      updater: (slots: EditorSlot[]) => EditorSlot[],
    ) => {
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
    };

    const clearSelection = () =>
      set({
        selection: null,
        feedbackMessage: null,
      });

    const replaceSelectedSlotWithPlayer = (
      playerId: EditorPlayer["id"],
      slotId: string,
    ) => {
      const player = get().playersById[playerId];
      if (!player) return;

      updateActiveQuarter((slots) =>
        replaceSlotPlayer({ player, slots, slotId }),
      );
      clearSelection();
    };

    const swapSelectedSlots = (targetSlotId: string, sourceSlotId: string) => {
      const playersById = get().playersById;
      updateActiveQuarter((slots) =>
        swapSlotPlayers({ playersById, slots, sourceSlotId, targetSlotId }),
      );
      clearSelection();
    };

    return {
      playersById: Object.fromEntries(
        players.map((player) => [player.id, player]),
      ),
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

      selectSlot: (slotId) => {
        const state = get();
        const activeQuarter = state.quartersByNumber[state.selectedQuarter];
        if (!activeQuarter?.slots.some((slot) => slot.id === slotId)) return;

        if (state.selection?.type === "bench") {
          replaceSelectedSlotWithPlayer(state.selection.id, slotId);
          return;
        }
        if (state.selection?.type !== "slot") {
          set({
            selection: { type: "slot", id: slotId },
            feedbackMessage: null,
          });
          return;
        }
        if (state.selection.id === slotId) {
          clearSelection();
          return;
        }
        swapSelectedSlots(slotId, state.selection.id);
      },

      selectBenchPlayer: (playerId) => {
        const state = get();
        if (!state.playersById[playerId]) return;
        if (state.selection?.type === "slot") {
          replaceSelectedSlotWithPlayer(playerId, state.selection.id);
          return;
        }
        if (
          state.selection?.type === "bench" &&
          state.selection.id === playerId
        ) {
          clearSelection();
          return;
        }
        set({
          feedbackMessage: "교체할 유니폼을 선택해주세요.",
          selection: { type: "bench", id: playerId },
        });
      },

      pasteQuarterAssignments: (targetQuarterNumber, sourceSlots) => {
        const state = get();
        const target = state.quartersByNumber[targetQuarterNumber];
        if (!target) return { ok: false, reason: "quarter_not_found" };
        const copiedSlots = copySlotAssignments({
          destinationSlots: target.slots,
          playersById: state.playersById,
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
        if (sourceQuarterNumber === targetQuarterNumber)
          return { ok: false, reason: "same_quarter" };
        const source = state.quartersByNumber[sourceQuarterNumber];
        const target = state.quartersByNumber[targetQuarterNumber];
        if (!source || !target)
          return { ok: false, reason: "quarter_not_found" };
        const playersById = state.playersById;
        const sourceSlots = copySlotAssignments({
          destinationSlots: source.slots,
          playersById,
          sourceSlots: target.slots,
        });
        const targetSlots = copySlotAssignments({
          destinationSlots: target.slots,
          playersById,
          sourceSlots: source.slots,
        });
        if (!sourceSlots || !targetSlots)
          return { ok: false, reason: "incompatible_positions" };
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
          playersById: { ...state.playersById, [player.id]: player },
        })),

      removeParticipantFromDraft: (playerId) =>
        set((state) => {
          const playersById = { ...state.playersById };
          delete playersById[playerId];
          return {
            playersById,
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
              state.selection.id === playerId
                ? null
                : state.selection,
          };
        }),

      refreshGuestAssignments: (player) =>
        set((state) => ({
          playersById: { ...state.playersById, [player.id]: player },
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
          return {
            quartersByNumber,
            selectedQuarter: quartersByNumber[state.selectedQuarter]
              ? state.selectedQuarter
              : (nextQuarters[0]?.quarterNumber ?? 1),
            selection: null,
          };
        }),

      setFeedbackMessage: (feedbackMessage) => set({ feedbackMessage }),
    };
  });
