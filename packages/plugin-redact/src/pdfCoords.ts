import type { PageViewport } from "pdfjs-dist";
import type { RedactRegion, ViewportRect } from "./types";

/** Convert a viewport-space drag rect to PDF point coordinates. */
export function viewportRectToPdfRegion(
  pageIndex: number,
  rect: ViewportRect,
  viewport: PageViewport,
): RedactRegion {
  const x1 = rect.left;
  const y1 = rect.top;
  const x2 = rect.left + rect.width;
  const y2 = rect.top + rect.height;
  const [pdfX1, pdfY1] = viewport.convertToPdfPoint(x1, y1);
  const [pdfX2, pdfY2] = viewport.convertToPdfPoint(x2, y2);
  return {
    pageIndex,
    x: Math.min(pdfX1, pdfX2),
    y: Math.min(pdfY1, pdfY2),
    width: Math.abs(pdfX2 - pdfX1),
    height: Math.abs(pdfY2 - pdfY1),
  };
}

/** Map PDF region to canvas pixel rect for overlay drawing. */
export function pdfRegionToCanvasRect(
  region: RedactRegion,
  viewport: PageViewport,
): ViewportRect {
  const [vx1, vy1] = viewport.convertToViewportPoint(region.x, region.y);
  const [vx2, vy2] = viewport.convertToViewportPoint(
    region.x + region.width,
    region.y + region.height,
  );
  return {
    left: Math.min(vx1, vx2),
    top: Math.min(vy1, vy2),
    width: Math.abs(vx2 - vx1),
    height: Math.abs(vy2 - vy1),
  };
}
