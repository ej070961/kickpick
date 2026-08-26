"use client";

import { useRef } from "react";
import { exportElementAsPng } from "@/features/formation-export/lib/exportElementAsPng";
import { sanitizeFileName } from "@/features/formation-editor/lib/formationEditorFormat";
import type { EditorQuarter } from "@/features/formation-editor/model/types";

type UseFormationExportInput = {
  activeQuarter: EditorQuarter | undefined;
  fileBaseName: string;
};

/**
 * 포메이션 필드 DOM을 PNG 파일로 저장하는 export ref와 action을 제공합니다.
 */
export function useFormationExport({
  activeQuarter,
  fileBaseName,
}: UseFormationExportInput) {
  const ref = useRef<HTMLDivElement>(null);

  async function downloadCurrent() {
    if (!ref.current || !activeQuarter) return;

    await exportElementAsPng({
      element: ref.current,
      fileName: `${sanitizeFileName(fileBaseName)}_${activeQuarter.quarterNumber}Q.png`,
    });
  }

  return {
    downloadCurrent,
    ref,
  };
}
