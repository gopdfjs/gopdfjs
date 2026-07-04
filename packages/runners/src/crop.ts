import { PDFDocument } from "pdf-lib";
import { readFileAsArrayBuffer } from "./readFile";

// margins in points (1mm ≈ 2.835 pts)
export async function cropPdf(
  file: File,
  margins: { top: number; bottom: number; left: number; right: number }
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const doc = await PDFDocument.load(bytes);

  for (const page of doc.getPages()) {
    const { x, y, width, height } = page.getMediaBox();
    page.setCropBox(
      x + margins.left,
      y + margins.bottom,
      width - margins.left - margins.right,
      height - margins.top - margins.bottom
    );
  }

  return doc.save();
}

export function mmToPt(mm: number) {
  return mm * 2.8346;
}
