import { PDFDocument } from "@cantoo/pdf-lib";

/** Loads an encrypted PDF, then re-saves without encryption. */
export async function unlockPdf(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { password });
  return doc.save();
}
