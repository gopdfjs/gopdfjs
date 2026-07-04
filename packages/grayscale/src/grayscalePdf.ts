import { PDFDocument } from "pdf-lib";
import { loadPdfFromFile } from "@gopdfjs/render";
import { GRAYSCALE_RENDER_SCALE } from "./constants";
import { rasterizeGrayscalePage } from "./rasterizeGrayscalePage";
import type {
  GrayscalePdfOptions,
  GrayscalePdfResult,
  GrayscaleProgressCallback,
} from "./types";

/** Convert every page to grayscale JPEG pages in a new PDF. */
export async function grayscalePdf(
  file: File,
  options: GrayscalePdfOptions,
  onProgress?: GrayscaleProgressCallback,
): Promise<GrayscalePdfResult> {
  const inputBytes = new Uint8Array(await file.arrayBuffer());
  const scale = options.renderScale ?? GRAYSCALE_RENDER_SCALE;
  const doc = await loadPdfFromFile(file);
  const inputPages = doc.numPages;
  const out = await PDFDocument.create();

  for (let i = 1; i <= inputPages; i++) {
    onProgress?.(i, inputPages);
    const page = await doc.getPage(i);
    const { jpegBytes, widthPt, heightPt } = await rasterizeGrayscalePage(
      page,
      options.mode,
      scale,
      options.jpegQuality,
    );
    const img = await out.embedJpg(jpegBytes);
    const newPage = out.addPage([widthPt, heightPt]);
    newPage.drawImage(img, { x: 0, y: 0, width: widthPt, height: heightPt });
  }

  const bytes = await out.save();
  return {
    bytes,
    inputPages,
    outputPages: inputPages,
    inputBytes: inputBytes.byteLength,
    outputBytes: bytes.byteLength,
  };
}
