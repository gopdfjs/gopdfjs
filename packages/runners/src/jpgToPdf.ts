import { PDFDocument } from "pdf-lib";
import { readFileAsArrayBuffer } from "./readFile";

export async function jpgToPdf(files: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = await readFileAsArrayBuffer(file);
    const isJpeg = file.type === "image/jpeg";
    const img = isJpeg
      ? await doc.embedJpg(bytes)
      : await doc.embedPng(bytes);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return doc.save();
}
