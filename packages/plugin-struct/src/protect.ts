import { PDFDocument } from "@cantoo/pdf-lib";

export async function protectPdf(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  doc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });
  return doc.save();
}
