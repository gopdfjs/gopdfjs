import type { GopdfAdapter, PdfJpegPage, PdfToJpegOptions } from "@gopdfjs/adapter/gopdf";
import { renderPageToJpeg } from "./renderPage";

const DEFAULT_JPEG_QUALITY = 0.92;
const DEFAULT_RENDER_SCALE = 2;

/** RFC 0018 — rasterize every page to JPEG via adapter canvas + pdf.js. */
export async function pdfToJpeg(
  adapter: GopdfAdapter,
  bytes: Uint8Array,
  options: PdfToJpegOptions = {},
): Promise<PdfJpegPage[]> {
  const quality = options.quality ?? DEFAULT_JPEG_QUALITY;
  const scale = options.scale ?? DEFAULT_RENDER_SCALE;
  const pdf = await adapter.pdfjs.loadDocument(bytes);
  const results: PdfJpegPage[] = [];

  for (let page = 1; page <= pdf.numPages; page++) {
    const pdfPage = await pdf.getPage(page);
    const jpegBytes = await renderPageToJpeg(pdfPage, adapter.canvas, scale, quality);
    results.push({ bytes: jpegBytes, page });
  }

  return results;
}
