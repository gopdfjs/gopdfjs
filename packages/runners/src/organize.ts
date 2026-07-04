import { PDFDocument } from "pdf-lib";
import { readFileAsArrayBuffer } from "./readFile";

export async function organizePdf(file: File, order: number[]): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const src = await PDFDocument.load(bytes);
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, order);
  pages.forEach((p) => doc.addPage(p));
  return doc.save();
}
