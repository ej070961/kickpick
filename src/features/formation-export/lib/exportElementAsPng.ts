import { toPng } from "html-to-image";

type ExportElementAsPngInput = {
  element: HTMLElement;
  fileName: string;
};

export async function exportElementAsPng({
  element,
  fileName,
}: ExportElementAsPngInput) {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: Math.max(2, window.devicePixelRatio || 1),
  });
  const link = document.createElement("a");

  link.download = fileName;
  link.href = dataUrl;
  link.click();
}
