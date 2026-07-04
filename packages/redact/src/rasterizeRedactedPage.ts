import type { PdfPage } from "@gopdfjs/render";
import { renderPdfToCanvas } from "@gopdfjs/render";
import { REDACT_RENDER_SCALE } from "./constants";
import type { RedactRegion } from "./types";

export type RasterizedPage = {
  pngBytes: Uint8Array;
  widthPt: number;
  heightPt: number;
};

/** Render page and burn black boxes — removes underlying text from output stream. */
export async function rasterizePageWithRedactions(
  page: PdfPage,
  regions: RedactRegion[],
  scale = REDACT_RENDER_SCALE,
): Promise<RasterizedPage> {
  const baseViewport = page.getViewport({ scale: 1 });
  const widthPt = baseViewport.width;
  const heightPt = baseViewport.height;

  const canvas = document.createElement("canvas");
  // PdfPage is structural; runtime value is pdf.js PDFPageProxy.
  await renderPdfToCanvas(page as unknown as Parameters<typeof renderPdfToCanvas>[0], canvas, scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.fillStyle = "#000000";
  for (const r of regions) {
    const x = r.x * scale;
    const y = (heightPt - r.y - r.height) * scale;
    ctx.fillRect(x, y, r.width * scale, r.height * scale);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), "image/png");
  });

  return {
    pngBytes: new Uint8Array(await blob.arrayBuffer()),
    widthPt,
    heightPt,
  };
}
