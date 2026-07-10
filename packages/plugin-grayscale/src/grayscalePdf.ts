import { PDFDocument } from "pdf-lib";
import type { GopdfRuntime } from "@gopdfjs/runtime";
import { GRAYSCALE_RENDER_SCALE } from "./constants";
import { rasterizeGrayscalePage } from "./rasterizeGrayscalePage";
import type {
  GrayscalePdfOptions,
  GrayscalePdfResult,
  GrayscaleProgressCallback,
} from "./types";

/** Convert every page to grayscale JPEG pages in a new PDF. */
export async function grayscalePdf(
  bytes: Uint8Array,
  runtime: GopdfRuntime,
  options: GrayscalePdfOptions,
  onProgress?: GrayscaleProgressCallback,
): Promise<GrayscalePdfResult> {
  const scale = options.renderScale ?? GRAYSCALE_RENDER_SCALE;
  const doc = await runtime.loadDocument(bytes);
  const inputPages = doc.numPages;
  const out = await PDFDocument.create();

  for (let i = 1; i <= inputPages; i++) {
    onProgress?.(i, inputPages);
    const page = await doc.getPage(i);
    const { jpegBytes, widthPt, heightPt } = await rasterizeGrayscalePage(
      page,
      runtime,
      options.mode,
      scale,
      options.jpegQuality,
    );
    const img = await out.embedJpg(jpegBytes);
    const newPage = out.addPage([widthPt, heightPt]);
    newPage.drawImage(img, { x: 0, y: 0, width: widthPt, height: heightPt });
  }

  const output = await out.save();
  return {
    bytes: output,
    inputPages,
    outputPages: inputPages,
    inputBytes: bytes.byteLength,
    outputBytes: output.byteLength,
  };
}
