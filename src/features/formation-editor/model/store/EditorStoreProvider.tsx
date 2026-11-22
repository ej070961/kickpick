"use client";

import { createContext, useState, type ReactNode } from "react";
import type { StoreApi } from "zustand/vanilla";
import { createEditorStore } from "./createEditorStore";
import type { EditorQuarter } from "@/features/formation-editor/model/types";
import type { EditorStore, EditorStoreInitialData } from "./types";

export const EditorStoreContext = createContext<
  StoreApi<EditorStore> | undefined
>(undefined);

type Props = {
  children: ReactNode;
  initialPlayers: EditorStoreInitialData["players"];
  initialQuarters: EditorQuarter[];
};

/** 경기마다 독립된 편집 store를 만들고 하위 편집기 영역에 제공합니다. */
export const EditorStoreProvider = ({
  children,
  initialPlayers,
  initialQuarters,
}: Props) => {
  const [store] = useState(() =>
    createEditorStore({ players: initialPlayers, quarters: initialQuarters }),
  );

  return (
    <EditorStoreContext.Provider value={store}>
      {children}
    </EditorStoreContext.Provider>
  );
};
