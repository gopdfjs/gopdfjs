import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts } from "pdf-lib";

/**
 * Creates a mock PDF with a specific number of pages.
 * Each page includes text so pdf-lib can embed pages (N-up).
 */
export async function createMockPdf(pageCount: number): Promise<File> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([200, 200]);
    page.drawText(`Page ${i + 1}`, { x: 50, y: 100, size: 12, font });
  }
  const bytes = await doc.save();
  return new File([bytes], `mock-${pageCount}.pdf`, { type: "application/pdf" });
}

/**
 * Loads the real sample PDF file from the disk.
 */
export async function getRealPdf(): Promise<File> {
  // Vitest runs with the package root as CWD
  const filePath = path.join(process.cwd(), "src/__tests__/data/image-based-pdf-sample.pdf");
  const buffer = fs.readFileSync(filePath);
  return new File([buffer], "image-based-pdf-sample.pdf", { type: "application/pdf" });
}
