import { PDFDocument } from "@cantoo/pdf-lib";

/**
 * Loads an encrypted PDF using the correct password, then re-saves it without encryption.
 * Throws an error if the password is incorrect.
 */
export async function unlockPdf(file: File, password: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), {
    password,
  });
  // Re-save without calling .encrypt() — the output is unprotected
  return doc.save();
}
