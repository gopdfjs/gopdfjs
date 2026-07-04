import type { PdfPage } from "@gopdfjs/render";
import { renderPdfToCanvas } from "@gopdfjs/render";
import { REPAIR_RENDER_SCALE } from "./constants";

export type RasterizedPage = {
  pngBytes: Uint8Array;
  widthPt: number;
  heightPt: number;
};

/** Render one page to PNG for visual rebuild fallback. */
export async function rasterizePage(
  page: PdfPage,
  scale = REPAIR_RENDER_SCALE,
): Promise<RasterizedPage> {
  const baseViewport = page.getViewport({ scale: 1 });
  const widthPt = baseViewport.width;
  const heightPt = baseViewport.height;

  const canvas = document.createElement("canvas");
  await renderPdfToCanvas(page as unknown as Parameters<typeof renderPdfToCanvas>[0], canvas, scale);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), "image/png");
  });

  return {
    pngBytes: new Uint8Array(await blob.arrayBuffer()),
    widthPt,
    heightPt,
  };
}
