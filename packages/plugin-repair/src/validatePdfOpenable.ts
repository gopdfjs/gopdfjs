import type { GopdfRuntime } from "@gopdfjs/runtime";
import { loadPdfForRepair, pdfLibPageCount } from "./loadPdfForRepair";
import type { RepairPdfOptions } from "./types";

/** Confirm output opens with at least one page. */
export async function validatePdfOpenable(
  bytes: Uint8Array,
  runtime: GopdfRuntime,
  options?: RepairPdfOptions,
): Promise<boolean> {
  try {
    const doc = await loadPdfForRepair(bytes, runtime, options);
    return doc.numPages > 0;
  } catch {
    try {
      return (await pdfLibPageCount(bytes, options)) > 0;
    } catch {
      return false;
    }
  }
}
