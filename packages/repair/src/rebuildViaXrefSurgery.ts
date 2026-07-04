import { ENDOBJ_MARKER } from "./constants";
import { collectPdfObjectEntries } from "./collectPdfObjects";
import { bytesToLatin1, concatBytes, latin1ToBytes } from "./latin1";

const ROOT_REF_RE = /\/Root\s+(\d+)\s+(\d+)\s+R/;
const CATALOG_TYPE_RE = /\/Type\s*\/Catalog\b/;

function findBodyEnd(text: string): number {
  const lastEndobj = text.lastIndexOf(ENDOBJ_MARKER);
  if (lastEndobj < 0) {
    return text.length;
  }
  return lastEndobj + ENDOBJ_MARKER.length;
}

function findRootReference(
  text: string,
  entries: ReturnType<typeof collectPdfObjectEntries>,
): { objectNumber: number; generation: number } | null {
  const rootMatch = text.match(ROOT_REF_RE);
  if (rootMatch) {
    return {
      objectNumber: parseInt(rootMatch[1]!, 10),
      generation: parseInt(rootMatch[2]!, 10),
    };
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const nextOffset = entries[i + 1]?.offset ?? text.length;
    const slice = text.slice(entry.offset, nextOffset);
    if (CATALOG_TYPE_RE.test(slice)) {
      return { objectNumber: entry.objectNumber, generation: entry.generation };
    }
  }

  return null;
}

/**
 * Rebuild classic xref + trailer from scanned object offsets.
 * Keeps object bodies intact; appends fresh xref at EOF.
 */
export function rebuildViaXrefSurgery(bytes: Uint8Array): Uint8Array {
  const text = bytesToLatin1(bytes);
  const entries = collectPdfObjectEntries(bytes);
  if (entries.length === 0) {
    throw new Error("No PDF objects found");
  }

  const root = findRootReference(text, entries);
  if (!root) {
    throw new Error("PDF catalog not found");
  }

  const bodyEnd = findBodyEnd(text);
  const bodyText = text.slice(0, bodyEnd).replace(/\s+$/, "");
  const bodyBytes = latin1ToBytes(`${bodyText}\n`);

  const maxObjectNumber = Math.max(...entries.map((e) => e.objectNumber));
  const size = maxObjectNumber + 1;
  const byNumber = new Map<number, (typeof entries)[number]>();
  for (const entry of entries) {
    byNumber.set(entry.objectNumber, entry);
  }

  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let n = 1; n < size; n++) {
    const entry = byNumber.get(n);
    if (entry) {
      xref += `${String(entry.offset).padStart(10, "0")} ${String(entry.generation).padStart(5, "0")} n \n`;
    } else {
      xref += "0000000000 65535 f \n";
    }
  }

  const xrefOffset = bodyBytes.byteLength;
  const trailer = `trailer\n<< /Size ${size} /Root ${root.objectNumber} ${root.generation} R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return concatBytes([bodyBytes, latin1ToBytes(xref + trailer)]);
}
