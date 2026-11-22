"use client";

import { useContext } from "react";
import { useStore } from "zustand";
import { EditorStoreContext } from "./EditorStoreProvider";
import type { EditorStore } from "./types";

/** Provider가 만든 편집 store에서 필요한 값만 selector로 구독합니다. */
export const useEditorStore = <T>(selector: (state: EditorStore) => T) => {
  const store = useContext(EditorStoreContext);
  if (!store)
    throw new Error("useEditorStore must be used within EditorStoreProvider");
  return useStore(store, selector);
};
