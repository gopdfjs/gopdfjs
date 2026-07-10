import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { TextFragment } from "./types";

/** Map pdf.js text items to fragments for spatial table detection. */
export function textItemsToFragments(items: TextItem[]): TextFragment[] {
  return items
    .filter((item) => item.str.trim().length > 0)
    .map((item) => ({
      text: item.str.trim(),
      x: item.transform[4],
      y: item.transform[5],
      width: item.width ?? Math.max(item.str.length * 4, 8),
    }));
}
