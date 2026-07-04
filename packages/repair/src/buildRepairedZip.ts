import JSZip from "jszip";
import type { BatchRepairItemResult } from "./types";

/** Zip successful batch repair outputs; skips failed items. */
export async function buildRepairedZip(items: BatchRepairItemResult[]): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const item of items) {
    if (!item.ok || !item.result) {
      continue;
    }
    const name = item.fileName.replace(/\.pdf$/i, "-repaired.pdf");
    zip.file(name, item.result.bytes);
  }
  return zip.generateAsync({ type: "uint8array" });
}
