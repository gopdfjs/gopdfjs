import { PDFDocument } from "pdf-lib";
import { pdfLibLoadOptions } from "./loadPdfForRepair";
import type { RepairPdfOptions } from "./types";

/** Rebuild xref/trailer by copying pages into a fresh pdf-lib document. */
export async function rebuildViaPdfLib(
  bytes: Uint8Array,
  options?: RepairPdfOptions,
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const src = await PDFDocument.load(bytes, pdfLibLoadOptions(options));
  const out = await PDFDocument.create();
  const indices = src.getPageIndices();
  if (indices.length === 0) {
    throw new Error("No pages in source PDF");
  }
  const pages = await out.copyPages(src, indices);
  for (const page of pages) {
    out.addPage(page);
  }
  return { bytes: await out.save(), pageCount: indices.length };
}
