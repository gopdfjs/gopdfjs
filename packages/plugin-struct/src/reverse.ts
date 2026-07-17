import { PDFDocument } from "pdf-lib";

/** Build descending page index order [n-1, …, 0]. */
export function reversePageOrder(pageCount: number): number[] {
  return Array.from({ length: pageCount }, (_, i) => pageCount - 1 - i);
}

/** Reverse all pages in a PDF via copyPages with a reversed index array. */
export async function reversePdf(bytes: Uint8Array): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const order = reversePageOrder(src.getPageCount());
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, order);
  pages.forEach((p) => doc.addPage(p));
  return doc.save();
}
