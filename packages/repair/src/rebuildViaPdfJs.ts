import { PDFDocument } from "pdf-lib";
import { loadPdfForRepair } from "./loadPdfForRepair";
import { rasterizePage } from "./rasterizePage";
import type { RepairPdfOptions, RepairProgressCallback } from "./types";

/** Rasterize every page via pdf.js when pdf-lib cannot load the source. */
export async function rebuildViaPdfJs(
  bytes: Uint8Array,
  options?: RepairPdfOptions,
  onProgress?: RepairProgressCallback,
): Promise<{ bytes: Uint8Array; pageCount: number; inputPages: number }> {
  const doc = await loadPdfForRepair(bytes, options);
  const inputPages = doc.numPages;
  if (inputPages === 0) {
    throw new Error("No pages in source PDF");
  }

  const out = await PDFDocument.create();
  for (let i = 1; i <= inputPages; i++) {
    onProgress?.(i, inputPages);
    const page = await doc.getPage(i);
    const { pngBytes, widthPt, heightPt } = await rasterizePage(page);
    const img = await out.embedPng(pngBytes);
    const newPage = out.addPage([widthPt, heightPt]);
    newPage.drawImage(img, { x: 0, y: 0, width: widthPt, height: heightPt });
  }

  return { bytes: await out.save(), pageCount: inputPages, inputPages };
}
