import type { RedactRegion } from "./types";

/** Group redaction rectangles by page for rasterize / copy decisions. */
export function groupRegionsByPage(regions: RedactRegion[]): Map<number, RedactRegion[]> {
  const map = new Map<number, RedactRegion[]>();
  for (const r of regions) {
    const list = map.get(r.pageIndex) ?? [];
    list.push(r);
    map.set(r.pageIndex, list);
  }
  return map;
}
