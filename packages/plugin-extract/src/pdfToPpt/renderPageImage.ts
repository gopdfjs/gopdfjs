import type { PDFPageProxy } from "pdfjs-dist/types/src/display/api";
import { RENDER_SCALE } from "./constants";

/** Rasterize one PDF page to a JPEG data URL for slide background. */
export async function renderPageBackgroundDataUrl(
  page: PDFPageProxy,
  scale = RENDER_SCALE,
): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.92);
}
