import { toPng } from "html-to-image";

export async function renderElementAsPng(element: HTMLElement) {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: Math.max(2, window.devicePixelRatio || 1),
  });

  return await (await fetch(dataUrl)).blob();
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.download = fileName;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
