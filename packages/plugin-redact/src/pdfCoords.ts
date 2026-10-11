import type { RedactRegion, ViewportRect } from "./types";

export type PageInfoDim = { width: number; height: number };

/** Convert a viewport-space drag rect to PDF point coordinates. */
export function viewportRectToPdfRegion(
  pageIndex: number,
  rect: ViewportRect,
  pageInfo: PageInfoDim,
  scale: number,
): RedactRegion {
  const pdfX = rect.left / scale;
  const pdfY = pageInfo.height - (rect.top + rect.height) / scale;
  return {
    pageIndex,
    x: pdfX,
    y: pdfY,
    width: rect.width / scale,
    height: rect.height / scale,
  };
}

/** Map PDF region to canvas pixel rect for overlay drawing. */
export function pdfRegionToCanvasRect(
  region: RedactRegion,
  pageInfo: PageInfoDim,
  scale: number,
): ViewportRect {
  const left = region.x * scale;
  const top = (pageInfo.height - (region.y + region.height)) * scale;
  return {
    left,
    top,
    width: region.width * scale,
    height: region.height * scale,
  };
}
