import type { PdfPage } from "@gopdfjs/render";
import type { PDFPageProxy } from "pdfjs-dist";
import { GRAYSCALE_JPEG_QUALITY, GRAYSCALE_RENDER_SCALE } from "./constants";
import { canvasFilterForMode } from "./canvasFilter";
import type { GrayscaleMode, RasterizedGrayscalePage } from "./types";

/** Render one PDF page to grayscale JPEG using canvas filters. */
export async function rasterizeGrayscalePage(
  page: PdfPage,
  mode: GrayscaleMode,
  scale = GRAYSCALE_RENDER_SCALE,
  jpegQuality = GRAYSCALE_JPEG_QUALITY,
  applyFilter = true,
): Promise<RasterizedGrayscalePage> {
  const pdfPage = page as unknown as PDFPageProxy;

  const baseViewport = pdfPage.getViewport({ scale: 1 });
  const widthPt = baseViewport.width;
  const heightPt = baseViewport.height;
  const viewport = pdfPage.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  if (applyFilter) {
    ctx.filter = canvasFilterForMode(mode);
  }

  await pdfPage.render({ canvas, canvasContext: ctx, viewport }).promise;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      jpegQuality,
    );
  });

  return {
    jpegBytes: new Uint8Array(await blob.arrayBuffer()),
    widthPt,
    heightPt,
  };
}
