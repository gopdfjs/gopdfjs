import { PDFDocument } from "pdf-lib";

export type ImageInput = { bytes: Uint8Array; mimeType: string };

export async function jpgToPdf(images: ImageInput[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const image of images) {
    const isJpeg = image.mimeType === "image/jpeg";
    const img = isJpeg ? await doc.embedJpg(image.bytes) : await doc.embedPng(image.bytes);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return doc.save();
}
