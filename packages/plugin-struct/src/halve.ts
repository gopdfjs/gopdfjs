import { PDFDocument, PDFPage } from "pdf-lib";

export type HalveOrientation = "vertical" | "horizontal";

export type PdfBox = { x: number; y: number; width: number; height: number };

export type HalvePdfOptions = {
  orientation: HalveOrientation;
  /** Cut position from left (vertical) or bottom (horizontal), 0–1. Default 0.5 */
  splitRatio?: number;
};

const MIN_SPLIT_RATIO = 0.05;
const MAX_SPLIT_RATIO = 0.95;
const DEFAULT_SPLIT_RATIO = 0.5;

/** Clamp split ratio so both halves keep visible area. */
export function clampSplitRatio(ratio: number): number {
  return Math.min(MAX_SPLIT_RATIO, Math.max(MIN_SPLIT_RATIO, ratio));
}

/** Compute first/second half MediaBox regions for a page split. */
export function computeHalveBoxes(
  mediaBox: PdfBox,
  orientation: HalveOrientation,
  splitRatio: number,
): [PdfBox, PdfBox] {
  const { x, y, width, height } = mediaBox;
  const ratio = clampSplitRatio(splitRatio);

  if (orientation === "vertical") {
    const splitX = x + width * ratio;
    const first: PdfBox = { x, y, width: splitX - x, height };
    const second: PdfBox = { x: splitX, y, width: x + width - splitX, height };
    return [first, second];
  }

  const splitY = y + height * ratio;
  const bottom: PdfBox = { x, y, width, height: splitY - y };
  const top: PdfBox = { x, y: splitY, width, height: y + height - splitY };
  return [top, bottom];
}

function applyHalveBox(page: PDFPage, box: PdfBox): void {
  page.setCropBox(box.x, box.y, box.width, box.height);
  page.setMediaBox(box.x, box.y, box.width, box.height);
}

/**
 * Split each page into two halves (vertical side-by-side or horizontal stack).
 * Output page count is exactly 2× the source.
 */
export async function halvePdf(
  bytes: Uint8Array,
  opts: HalvePdfOptions,
): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const splitRatio = opts.splitRatio ?? DEFAULT_SPLIT_RATIO;
  const srcPages = src.getPages();

  for (let i = 0; i < srcPages.length; i++) {
    const mediaBox = srcPages[i].getMediaBox();
    const [firstBox, secondBox] = computeHalveBoxes(
      mediaBox,
      opts.orientation,
      splitRatio,
    );

    const [firstPage, secondPage] = await out.copyPages(src, [i, i]);
    applyHalveBox(firstPage, firstBox);
    applyHalveBox(secondPage, secondBox);
    out.addPage(firstPage);
    out.addPage(secondPage);
  }

  return out.save();
}
