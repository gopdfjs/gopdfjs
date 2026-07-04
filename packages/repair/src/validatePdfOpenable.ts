import { loadPdfForRepair, pdfLibPageCount } from "./loadPdfForRepair";
import type { RepairPdfOptions } from "./types";

/** Confirm output opens with at least one page (pdf.js in browser; pdf-lib fallback in Node tests). */
export async function validatePdfOpenable(
  bytes: Uint8Array,
  options?: RepairPdfOptions,
): Promise<boolean> {
  try {
    const doc = await loadPdfForRepair(bytes, options);
    return doc.numPages > 0;
  } catch {
    try {
      return (await pdfLibPageCount(bytes, options)) > 0;
    } catch {
      return false;
    }
  }
}
