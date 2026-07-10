import { PDFDocument } from "pdf-lib";
export async function cropPdf(
  bytes: Uint8Array,
  margins: { top: number; bottom: number; left: number; right: number },
): Promise<Uint8Array> {
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
