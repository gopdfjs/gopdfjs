import { ENDOBJ_MARKER, OBJ_MARKER_RE, STARTXREF_MARKER, TRAILER_MARKER } from "./constants";
import { bytesToLatin1 } from "./latin1";

export type ObjectScanResult = {
  objectsFound: number;
  objectsWithEndobj: number;
  orphanObjects: number;
  hasStartxref: boolean;
  hasTrailer: boolean;
  fileSizeBytes: number;
};

/** Scan raw bytes for obj/endobj markers and structural hints. */
export function scanPdfObjects(bytes: Uint8Array): ObjectScanResult {
  const text = bytesToLatin1(bytes);
  const matches = [...text.matchAll(OBJ_MARKER_RE)];
  const objectsFound = matches.length;

  let objectsWithEndobj = 0;
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i]!.index ?? 0;
    const nextStart = i + 1 < matches.length ? (matches[i + 1]!.index ?? text.length) : text.length;
    const slice = text.slice(start, nextStart);
    if (slice.includes(ENDOBJ_MARKER)) {
      objectsWithEndobj += 1;
    }
  }

  return {
    objectsFound,
    objectsWithEndobj,
    orphanObjects: objectsFound - objectsWithEndobj,
    hasStartxref: text.includes(STARTXREF_MARKER),
    hasTrailer: text.includes(TRAILER_MARKER),
    fileSizeBytes: bytes.byteLength,
  };
}
