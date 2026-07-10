import { PDFDocument, degrees } from "pdf-lib";

export async function rotatePdf(
  bytes: Uint8Array,
  rotation: 90 | 180 | 270,
  pageIndices: number[] | "all",
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  const targets = pageIndices === "all" ? pages.map((_, i) => i) : pageIndices;
  targets.forEach((i) => {
    const page = pages[i];
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rotation) % 360));
  });
  return doc.save();
}
