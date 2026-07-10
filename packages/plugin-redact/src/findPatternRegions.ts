import type { PdfDocument, PdfPage, PdfTextContentItem } from "@gopdfjs/runtime";
import { PATTERN_MATCH_PADDING_PT } from "./constants";
import { matchAllPatterns } from "./patterns";
import type { RedactPatternKey, RedactRegion } from "./types";

type CharBox = {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function fontSizeFromTransform(transform: number[]): number {
  return Math.sqrt(transform[2] ** 2 + transform[3] ** 2);
}

function collectCharBoxes(items: PdfTextContentItem[]): CharBox[] {
  const boxes: CharBox[] = [];

  for (const raw of items) {
    if (!("str" in raw) || typeof raw.str !== "string" || !Array.isArray(raw.transform)) continue;
    const text = raw.str;
    if (!text.trim()) continue;
    const x0 = raw.transform[4];
    const y0 = raw.transform[5];
    const h = fontSizeFromTransform(raw.transform);
    const totalChars = text.length || 1;
    const charW = (raw.width ?? h * totalChars * 0.5) / totalChars;
    let x = x0;

    for (const ch of text) {
      boxes.push({ char: ch, x, y: y0, width: charW, height: h });
      x += charW;
    }
  }

  return boxes;
}

function boxesToRegion(pageIndex: number, boxes: CharBox[], padding: number): RedactRegion | null {
  if (boxes.length === 0) return null;
  const x = Math.min(...boxes.map((b) => b.x)) - padding;
  const y = Math.min(...boxes.map((b) => b.y)) - padding;
  const right = Math.max(...boxes.map((b) => b.x + b.width)) + padding;
  const top = Math.max(...boxes.map((b) => b.y + b.height)) + padding;
  return {
    pageIndex,
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, top - y),
  };
}

async function findOnPage(page: PdfPage, pageIndex: number, patternKeys: RedactPatternKey[]): Promise<RedactRegion[]> {
  const content = await page.getTextContent({ includeMarkedContent: false });
  const boxes = collectCharBoxes(content.items);
  const fullText = boxes.map((b) => b.char).join("");
  const matches = matchAllPatterns(fullText, patternKeys);
  const regions: RedactRegion[] = [];

  for (const match of matches) {
    if (match.index === undefined) continue;
    const start = match.index;
    const end = start + match[0].length;
    const slice = boxes.slice(start, end);
    const region = boxesToRegion(pageIndex, slice, PATTERN_MATCH_PADDING_PT);
    if (region) regions.push(region);
  }

  return regions;
}

/** Scan all pages for pattern matches and return redaction boxes. */
export async function findPatternRegions(
  doc: PdfDocument,
  patternKeys: RedactPatternKey[],
): Promise<RedactRegion[]> {
  if (patternKeys.length === 0) return [];
  const regions: RedactRegion[] = [];

  for (let pageIndex = 0; pageIndex < doc.numPages; pageIndex++) {
    const page = await doc.getPage(pageIndex + 1);
    regions.push(...(await findOnPage(page, pageIndex, patternKeys)));
  }

  return regions;
}
