import { PT_PER_INCH } from "./constants";

/** Map PDF points to slide inches along one axis. */
export function ptToSlideInches(pt: number, pagePt: number, slideIn: number): number {
  if (pagePt <= 0) return 0;
  return (pt / pagePt) * slideIn;
}

/** PDF baseline y (bottom-origin) → inches from slide top. */
export function pdfYToSlideTopInches(
  yPt: number,
  fontSizePt: number,
  pageHeightPt: number,
  slideHeightIn: number,
): number {
  const fromTopPt = pageHeightPt - yPt - fontSizePt;
  return ptToSlideInches(fromTopPt, pageHeightPt, slideHeightIn);
}

export function fontSizePtToSlidePoints(fontSizePt: number, pageHeightPt: number, slideHeightIn: number): number {
  const fontIn = fontSizePt / PT_PER_INCH;
  const slideRatio = slideHeightIn / (pageHeightPt / PT_PER_INCH);
  return Math.max(8, Math.round(fontIn * slideRatio * PT_PER_INCH));
}
