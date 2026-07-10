import { PDFDocument } from "pdf-lib";

export type SignPlacement = {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function signPdf(
  bytes: Uint8Array,
  pngBytes: Uint8Array,
  placement: SignPlacement,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);

  const img = await doc.embedPng(pngBytes);

  const pages = doc.getPages();
  const page = pages[placement.pageIndex];
  if (!page) return doc.save();

  page.drawImage(img, {
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
  });

  return doc.save();
}
