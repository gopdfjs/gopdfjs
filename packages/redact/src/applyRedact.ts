import { PDFDocument } from "pdf-lib";
import { loadPdfDocument } from "@gopdfjs/render";
import { groupRegionsByPage } from "./groupRegions";
import { rasterizePageWithRedactions } from "./rasterizeRedactedPage";
import type { RedactPdfOptions, RedactRegion } from "./types";

function scrubDocumentMetadata(doc: PDFDocument): void {
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("");
  doc.setProducer("");
}

/**
 * Permanently redact regions by rasterizing affected pages (text stream removed).
 * Unaffected pages are copied verbatim from the source PDF.
 */
export async function redactPdf(
  file: File,
  regions: RedactRegion[],
  options: RedactPdfOptions = {},
  onProgress?: (current: number, total: number) => void,
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes);
  const pdfjsDoc = await loadPdfDocument(bytes);
  const byPage = groupRegionsByPage(regions);
  const outDoc = await PDFDocument.create();
  const pageCount = srcDoc.getPageCount();

  for (let i = 0; i < pageCount; i++) {
    onProgress?.(i + 1, pageCount);
    const pageRegions = byPage.get(i) ?? [];

    if (pageRegions.length === 0) {
      const [copied] = await outDoc.copyPages(srcDoc, [i]);
      outDoc.addPage(copied);
      continue;
    }

    const page = await pdfjsDoc.getPage(i + 1);
    const { pngBytes, widthPt, heightPt } = await rasterizePageWithRedactions(page, pageRegions);
    const img = await outDoc.embedPng(pngBytes);
    const newPage = outDoc.addPage([widthPt, heightPt]);
    newPage.drawImage(img, { x: 0, y: 0, width: widthPt, height: heightPt });
  }

  if (options.scrubMetadata) {
    scrubDocumentMetadata(outDoc);
  }

  return outDoc.save();
}
