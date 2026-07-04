import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { LINE_Y_TOLERANCE_PT } from "./constants";
import { fontSizePtToSlidePoints, pdfYToSlideTopInches, ptToSlideInches } from "./coordinates";
import type { SlideTextBox } from "./types";

interface LineRun {
  x: number;
  y: number;
  text: string;
  width: number;
  fontSize: number;
  bold: boolean;
}

function fontSizeFromTransform(transform: number[]): number {
  return Math.sqrt(transform[2] ** 2 + transform[3] ** 2);
}

function isBold(fontName: string): boolean {
  return /bold|heavy|black/i.test(fontName);
}

function groupItemsIntoLines(items: TextItem[]): LineRun[][] {
  const lines: LineRun[][] = [];

  for (const item of items) {
    if (!item.str.trim()) continue;
    const y = item.transform[5];
    const x = item.transform[4];
    const fontSize = fontSizeFromTransform(item.transform);
    const width = item.width ?? Math.max(item.str.length * fontSize * 0.5, 8);
    const run: LineRun = {
      x,
      y,
      text: item.str,
      width,
      fontSize,
      bold: isBold(item.fontName ?? ""),
    };

    const lineIdx = lines.findIndex((line) => Math.abs(line[0].y - y) <= LINE_Y_TOLERANCE_PT);
    if (lineIdx >= 0) {
      lines[lineIdx].push(run);
    } else {
      lines.push([run]);
    }
  }

  for (const line of lines) {
    line.sort((a, b) => a.x - b.x);
  }

  return lines;
}

/** Build editable text boxes from pdf.js text items for one page. */
export function extractTextBoxesFromItems(
  items: TextItem[],
  pageWidthPt: number,
  pageHeightPt: number,
  slideWidthIn: number,
  slideHeightIn: number,
): SlideTextBox[] {
  const boxes: SlideTextBox[] = [];
  const lines = groupItemsIntoLines(items);

  for (const line of lines) {
    const text = line.map((r) => r.text).join(" ").trim();
    if (!text) continue;

    const xPt = Math.min(...line.map((r) => r.x));
    const maxRight = Math.max(...line.map((r) => r.x + r.width));
    const yPt = line[0].y;
    const fontSizePt = Math.max(...line.map((r) => r.fontSize));
    const bold = line.some((r) => r.bold);

    const x = ptToSlideInches(xPt, pageWidthPt, slideWidthIn);
    const y = pdfYToSlideTopInches(yPt, fontSizePt, pageHeightPt, slideHeightIn);
    const w = Math.max(ptToSlideInches(maxRight - xPt, pageWidthPt, slideWidthIn), 0.5);
    const h = Math.max(ptToSlideInches(fontSizePt * 1.3, pageHeightPt, slideHeightIn), 0.2);
    const fontSize = fontSizePtToSlidePoints(fontSizePt, pageHeightPt, slideHeightIn);

    boxes.push({ text, x, y, w, h, fontSize, bold });
  }

  return boxes;
}

export { groupItemsIntoLines };
