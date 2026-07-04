import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { pdfjs } from "@gopdfjs/render";

/** Y-axis tolerance when grouping pdf.js items into the same line (pt). */
export const TEXT_RUN_LINE_Y_TOLERANCE_PT = 3;

/** One editable text run in PDF user space (origin bottom-left). */
export interface PdfTextRun {
  id: string;
  pageIndex: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

function fontSizeFromTransform(transform: number[]): number {
  return Math.sqrt(transform[2] ** 2 + transform[3] ** 2);
}

/** Group pdf.js text items on one page into line-level runs for click-to-edit. */
export function groupTextItemsIntoRuns(items: TextItem[], pageIndex: number): PdfTextRun[] {
  const lines: Array<{
    y: number;
    runs: Array<{ text: string; x: number; width: number; fontSize: number; fontName: string }>;
  }> = [];

  for (const item of items) {
    if (!item.str.trim()) continue;
    const y = item.transform[5];
    const x = item.transform[4];
    const fontSize = fontSizeFromTransform(item.transform);
    const width = item.width ?? Math.max(item.str.length * fontSize * 0.5, 8);
    const run = {
      text: item.str,
      x,
      width,
      fontSize,
      fontName: item.fontName ?? "Helvetica",
    };

    const line = lines.find((entry) => Math.abs(entry.y - y) <= TEXT_RUN_LINE_Y_TOLERANCE_PT);
    if (line) {
      line.runs.push(run);
      if (y > line.y) line.y = y;
    } else {
      lines.push({ y, runs: [run] });
    }
  }

  const result: PdfTextRun[] = [];
  lines.sort((a, b) => b.y - a.y);

  lines.forEach((line, lineIndex) => {
    line.runs.sort((a, b) => a.x - b.x);
    const text = line.runs.map((run) => run.text).join(" ").trim();
    if (!text) return;

    const x = Math.min(...line.runs.map((run) => run.x));
    const maxRight = Math.max(...line.runs.map((run) => run.x + run.width));
    const fontSize = Math.max(...line.runs.map((run) => run.fontSize));
    const fontName = line.runs[0]?.fontName ?? "Helvetica";

    result.push({
      id: `p${pageIndex}-l${lineIndex}`,
      pageIndex,
      text,
      x,
      y: line.y,
      width: Math.max(maxRight - x, fontSize),
      height: fontSize * 1.25,
      fontSize,
      fontName,
    });
  });

  return result;
}

/** Extract editable text runs from every page of a PDF. */
export async function extractPdfTextRuns(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<PdfTextRun[]> {
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const allRuns: PdfTextRun[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(pageNum, pdf.numPages);
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent({ includeMarkedContent: false });
    const items = content.items.filter(
      (item): item is TextItem => "str" in item && item.str.trim().length > 0,
    );
    allRuns.push(...groupTextItemsIntoRuns(items, pageNum - 1));
  }

  return allRuns;
}
