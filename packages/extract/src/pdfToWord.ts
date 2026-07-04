import type { TextItem } from "pdfjs-dist/types/src/display/api";
import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  PageBreak,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { pdfjs } from "@gopdfjs/render";

interface RichLine {
  y: number;
  x: number;
  runs: Array<{ text: string; bold: boolean; italic: boolean; fontSize: number; font: string }>;
  fontSize: number; // dominant size on this line
}

function fontFlags(fontName: string): { bold: boolean; italic: boolean } {
  const name = fontName.toLowerCase();
  return {
    bold: /bold|heavy|black/.test(name),
    italic: /italic|oblique/.test(name),
  };
}

function scaleToFontSize(transform: number[]): number {
  // The font size is the magnitude of the vertical scale component of the transform matrix
  return Math.round(Math.sqrt(transform[2] ** 2 + transform[3] ** 2));
}

function headingLevel(
  fontSize: number,
  bodySize: number
): (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined {
  const ratio = fontSize / bodySize;
  if (ratio >= 2.0) return HeadingLevel.HEADING_1;
  if (ratio >= 1.6) return HeadingLevel.HEADING_2;
  if (ratio >= 1.3) return HeadingLevel.HEADING_3;
  return undefined;
}

export async function pdfToWord(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

  const allChildren: Paragraph[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(pageNum, pdf.numPages);
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent({ includeMarkedContent: false });

    // ── 1. Collect rich text items ────────────────────────────────────────
    const items = content.items.filter(
      (item): item is TextItem => "str" in item && item.str.trim().length > 0
    );

    if (items.length === 0) {
      if (pageNum < pdf.numPages) allChildren.push(new Paragraph({ children: [new PageBreak()] }));
      continue;
    }

    // ── 2. Determine body font size (mode of all sizes) ───────────────────
    const sizeCounts: Record<number, number> = {};
    for (const item of items) {
      const s = scaleToFontSize(item.transform);
      if (s > 0) sizeCounts[s] = (sizeCounts[s] ?? 0) + 1;
    }
    const sortedSizes = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1]);
    const bodySize = sortedSizes.length > 0 ? Number(sortedSizes[0][0]) : 11;

    // ── 3. Group items into lines by Y coordinate (±2pt tolerance) ───────
    const lines: RichLine[] = [];
    for (const item of items) {
      const y = item.transform[5];
      const x = item.transform[4];
      const fontSize = scaleToFontSize(item.transform);
      const { bold, italic } = fontFlags(item.fontName ?? "");

      const existing = lines.find((l) => Math.abs(l.y - y) < 3);
      if (existing) {
        existing.runs.push({ text: item.str, bold, italic, fontSize, font: item.fontName ?? "Calibri" });
        existing.fontSize = Math.max(existing.fontSize, fontSize);
        if (x < existing.x) existing.x = x;
      } else {
        lines.push({
          y,
          x,
          runs: [{ text: item.str, bold, italic, fontSize, font: item.fontName ?? "Calibri" }],
          fontSize,
        });
      }
    }

    // Sort lines top-to-bottom (highest Y = top in PDF space)
    lines.sort((a, b) => b.y - a.y);


    // ── 5. Build docx Paragraphs ──────────────────────────────────────────
    for (const line of lines) {
      // Sort runs left-to-right
      line.runs.sort(() => 0); // already in extraction order

      const heading = headingLevel(line.fontSize, bodySize);
      const textRuns = line.runs.map(
        (run) =>
          new TextRun({
            text: run.text,
            bold: run.bold || heading !== undefined,
            italics: run.italic,
            size: Math.max(run.fontSize, bodySize) * 2, // docx uses half-points
            font: "Calibri",
          })
      );

      allChildren.push(
        new Paragraph({
          heading,
          children: textRuns,
          spacing: { after: heading ? 200 : 80 },
          alignment: AlignmentType.LEFT,
        })
      );
    }

    if (pageNum < pdf.numPages) {
      allChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children: allChildren }],
  });

  return Packer.toBlob(doc);
}
