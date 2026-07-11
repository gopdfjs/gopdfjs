import type { GopdfAdapter } from "@gopdfjs/adapter/gopdf";
import { renderPageToJpeg } from "./renderPage";

const OCR_RENDER_SCALE = 2;
const DEFAULT_OCR_LANG = "eng";

/** OCR every page — requires `adapter.ocr` (Node adapter). */
export async function ocrPdf(
  adapter: GopdfAdapter,
  bytes: Uint8Array,
  lang = DEFAULT_OCR_LANG,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  if (!adapter.ocr) {
    throw new Error("OCR requires adapter.ocr on the host adapter");
  }

  const pdf = await adapter.pdfjs.loadDocument(bytes);
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const imageBytes = await renderPageToJpeg(page, adapter.canvas, OCR_RENDER_SCALE, 0.92);
    const text = await adapter.ocr.recognize(imageBytes, lang, (fraction) => {
      const pageFraction = (i - 1 + fraction) / pdf.numPages;
      onProgress?.(pageFraction);
    });
    fullText += `${text}\n\n`;
    onProgress?.(i / pdf.numPages);
  }

  return fullText.trim();
}
