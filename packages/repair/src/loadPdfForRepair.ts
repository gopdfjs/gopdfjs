import { PDFDocument } from "pdf-lib";
import { pdfjs } from "@gopdfjs/render";
import type { PdfDocument } from "@gopdfjs/render";
import type { RepairPdfOptions } from "./types";

/** pdf.js load with optional password for repair fallback paths. */
export async function loadPdfForRepair(
  bytes: Uint8Array,
  options?: RepairPdfOptions,
): Promise<PdfDocument> {
  const params: { data: Uint8Array; password?: string } = { data: bytes };
  if (options?.password) {
    params.password = options.password;
  }
  const doc = await pdfjs.getDocument(params).promise;
  return doc as unknown as PdfDocument;
}

export function pdfLibLoadOptions(options?: RepairPdfOptions) {
  if (options?.password) {
    return { password: options.password };
  }
  return { ignoreEncryption: true };
}

/** pdf-lib open check used when pdf.js is unavailable (Node tests). */
export async function pdfLibPageCount(bytes: Uint8Array, options?: RepairPdfOptions): Promise<number> {
  const doc = await PDFDocument.load(bytes, pdfLibLoadOptions(options));
  return doc.getPageCount();
}
