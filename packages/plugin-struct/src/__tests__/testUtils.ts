import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts } from "pdf-lib";

/** Mock PDF bytes with embeddable text per page (N-up, halve, etc.). */
export async function createMockPdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([200, 200]);
    page.drawText(`Page ${i + 1}`, { x: 50, y: 100, size: 12, font });
  }
  return doc.save();
}

/** Sample image-based PDF from package test fixtures. */
export async function getRealPdf(): Promise<Uint8Array> {
  const filePath = path.join(process.cwd(), "src/__tests__/data/image-based-pdf-sample.pdf");
  const buffer = fs.readFileSync(filePath);
  return new Uint8Array(buffer);
}
