"use client";

import { useRef, useState } from "react";
import { createZipBlob } from "@/features/formation-export/lib/createZipBlob";
import {
  downloadBlob,
  renderElementAsPng,
} from "@/features/formation-export/lib/exportElementAsPng";
import { sanitizeFileName } from "@/features/formation-editor/lib/editorFormatting";
import { toQuarterList } from "@/features/formation-editor/lib/quarterDraft";
import { useEditorStore } from "@/features/formation-editor/model/store";

type UseFormationExportInput = {
  fileBaseName: string;
};

/**
 * 포메이션 필드 DOM을 PNG 파일로 저장하는 export ref와 action을 제공합니다.
 */
export const useFormationImages = ({
  fileBaseName,
}: UseFormationExportInput) => {
  const ref = useRef<HTMLDivElement>(null);
  const quarterRefs = useRef(new Map<number, HTMLDivElement>());
  const [isExportPending, setIsExportPending] = useState(false);
  const selectedQuarter = useEditorStore(
    (state) => state.selectedQuarter,
  );
  const quartersByNumber = useEditorStore(
    (state) => state.quartersByNumber,
  );
  const quarters = toQuarterList(quartersByNumber);
  const setFeedbackMessage = useEditorStore(
    (state) => state.setFeedbackMessage,
  );

  const registerQuarterElement = (
    quarterNumber: number,
    element: HTMLDivElement | null,
  ) => {
    if (element) quarterRefs.current.set(quarterNumber, element);
    else quarterRefs.current.delete(quarterNumber);
  };

  const copyCurrent = async (): Promise<string | null> => {
    if (!ref.current) return null;

    try {
      const blob = await renderElementAsPng(ref.current);

      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        downloadBlob(
          blob,
          `${sanitizeFileName(fileBaseName)}_${selectedQuarter}Q.png`,
        );
        return "이미지 복사를 지원하지 않아 PNG로 저장했어요.";
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        return "이미지를 복사했어요.";
      } catch {
        downloadBlob(
          blob,
          `${sanitizeFileName(fileBaseName)}_${selectedQuarter}Q.png`,
        );
        return "복사할 수 없어 PNG로 저장했어요.";
      }
    } catch {
      return "이미지 복사에 실패했어요. 다시 시도해주세요.";
    }
  };

  const downloadAll = async () => {
    if (quarters.length === 0) return;

    setIsExportPending(true);
    setFeedbackMessage("전체 쿼터 이미지를 준비하고 있어요.");

    try {
      const files = [];

      for (const quarter of quarters) {
        const element = quarterRefs.current.get(quarter.quarterNumber);

        if (!element) throw new Error("쿼터 이미지 영역을 찾을 수 없습니다.");

        files.push({
          data: await renderElementAsPng(element),
          name: `${sanitizeFileName(fileBaseName)}_${quarter.quarterNumber}Q.png`,
        });
      }

      const archive = await createZipBlob(files);
      downloadBlob(archive, `${sanitizeFileName(fileBaseName)}_전체쿼터.zip`);
      setFeedbackMessage(
        `${quarters.length}개 쿼터 이미지를 ZIP으로 저장했어요.`,
      );
    } catch {
      setFeedbackMessage(
        "전체 쿼터 이미지를 만들지 못했어요. 다시 시도해주세요.",
      );
    } finally {
      setIsExportPending(false);
    }
  };

  return {
    copyCurrent,
    downloadAll,
    isExportPending,
    registerQuarterElement,
    ref,
  };
};
