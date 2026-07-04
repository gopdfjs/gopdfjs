import { OBJ_MARKER_RE } from "./constants";
import { bytesToLatin1 } from "./latin1";

export type PdfObjectEntry = {
  objectNumber: number;
  generation: number;
  offset: number;
};

/** Collect byte offsets for each `obj` header in the file. */
export function collectPdfObjectEntries(bytes: Uint8Array): PdfObjectEntry[] {
  const text = bytesToLatin1(bytes);
  const entries: PdfObjectEntry[] = [];
  for (const match of text.matchAll(OBJ_MARKER_RE)) {
    entries.push({
      objectNumber: parseInt(match[1]!, 10),
      generation: parseInt(match[2]!, 10),
      offset: match.index ?? 0,
    });
  }
  return entries;
}
