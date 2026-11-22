"use client";

import type { FormationEditorProps } from "@/features/formation-editor/model/types";
import { EditorStoreProvider } from "@/features/formation-editor/model/store";
import { ErrorState } from "@/shared/ui";
import { FormationEditorContent } from "./FormationEditorContent";

/** 경기 데이터마다 분리된 편집기 store와 편집 화면을 연결합니다. */
export const FormationEditor = ({
  match,
  players,
  quarters,
  isReadOnly = false,
}: FormationEditorProps) => {
  if (quarters.length === 0) {
    return (
      <ErrorState
        title="생성된 포메이션이 없습니다"
        description="경기 생성 과정에서 쿼터별 포메이션이 만들어지지 않았습니다. 경기 목록으로 돌아가 다시 생성해주세요."
      />
    );
  }

  return (
    <EditorStoreProvider
      key={match.id}
      initialPlayers={players}
      initialQuarters={quarters}
    >
      <FormationEditorContent match={match} isReadOnly={isReadOnly} />
    </EditorStoreProvider>
  );
};
