import { PDFDocument } from "pdf-lib";
import type { GopdfRuntime } from "@gopdfjs/runtime";
import type { PdfDocument } from "@gopdfjs/runtime";
import type { RepairPdfOptions } from "./types";

/** pdf.js load with optional password for repair fallback paths. */
export async function loadPdfForRepair(
  bytes: Uint8Array,
  runtime: GopdfRuntime,
  options?: RepairPdfOptions,
): Promise<PdfDocument> {
  void options?.password;
  return runtime.loadDocument(bytes);
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
