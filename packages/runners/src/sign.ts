import { PDFDocument } from "pdf-lib";
import { readFileAsArrayBuffer } from "./readFile";

export type SignPlacement = {
  pageIndex: number;
  x: number; // PDF points from left
  y: number; // PDF points from bottom
  width: number;
  height: number;
};

export async function signPdf(file: File, dataUrl: string, placement: SignPlacement): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const doc = await PDFDocument.load(bytes);

  const base64 = dataUrl.split(",")[1];
  const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const img = await doc.embedPng(imgBytes);

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
