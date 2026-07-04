import { pdfjs } from "@gopdfjs/render";
import { createCanvas } from "@napi-rs/canvas";

/**
 * Renders pages of a PDF into JPEG byte buffers inside Node.js.
 */
export async function pdfToImages(
  pdfBytes: Uint8Array,
  quality = 0.92,
  scale = 2
): Promise<{ bytes: Uint8Array; page: number }[]> {
  const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
  const results: { bytes: Uint8Array; page: number }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    
    const buffer = await canvas.toBuffer("image/jpeg", Math.round(quality * 100));
    results.push({ bytes: new Uint8Array(buffer), page: i });
  }
  return results;
}
