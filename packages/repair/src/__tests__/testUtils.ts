import { PDFDocument } from "pdf-lib";

/** Minimal PDF bytes for unit tests. */
export async function createMockPdfBytes(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([200, 200]);
  }
  return doc.save();
}

/** Corrupt xref marker while keeping object bodies (common download truncation pattern). */
export function corruptStartxref(bytes: Uint8Array): Uint8Array {
  const copy = new Uint8Array(bytes);
  let text = "";
  for (let i = 0; i < copy.length; i++) {
    text += String.fromCharCode(copy[i]!);
  }
  const broken = text.replace("startxref", "startxreF_BROKEN");
  const out = new Uint8Array(broken.length);
  for (let i = 0; i < broken.length; i++) {
    out[i] = broken.charCodeAt(i);
  }
  return out;
}
