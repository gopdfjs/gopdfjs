import type { GopdfAdapter, PdfToTextOptions } from "@gopdfjs/adapter/gopdf";
import type { PdfTextContentItem } from "@gopdfjs/runtime/document";
import { renderPageToJpeg } from "./renderPage";

const LINE_Y_TOLERANCE_PT = 4;
const DEFAULT_TEXT_RENDER_SCALE = 1.5;

type TextLine = { y: number; parts: Array<{ x: number; text: string }> };

function groupItemsIntoLines(items: PdfTextContentItem[]): string[] {
  const lines: TextLine[] = [];

  for (const item of items) {
    const text = item.str?.trim();
    if (!text || !item.transform) continue;
    const y = item.transform[5];
    const x = item.transform[4];
    const existing = lines.find((line) => Math.abs(line.y - y) <= LINE_Y_TOLERANCE_PT);
    if (existing) {
      existing.parts.push({ x, text });
    } else {
      lines.push({ y, parts: [{ x, text }] });
    }
  }

  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) =>
      line.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(" "),
    );
}

function pagesToPlainText(pages: Array<{ pageNumber: number; lines: string[] }>): string {
  return pages
    .map((p) => [`--- Page ${p.pageNumber} ---`, ...p.lines, ""].join("\n"))
    .join("\n")
    .trim();
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/** Extract text (and optional HTML with page snapshots) via adapter pdf.js. */
export async function pdfToText(
  adapter: GopdfAdapter,
  bytes: Uint8Array,
  options: PdfToTextOptions = {},
  onProgress?: (current: number, total: number) => void,
): Promise<string> {
  const format = options.format ?? "txt";
  const scale = options.renderScale ?? DEFAULT_TEXT_RENDER_SCALE;
  const pdf = await adapter.pdfjs.loadDocument(bytes);
  const pages: Array<{ pageNumber: number; lines: string[] }> = [];
  const pageImages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(pageNum, pdf.numPages);
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent({ includeMarkedContent: false });
    pages.push({ pageNumber: pageNum, lines: groupItemsIntoLines(content.items) });

    if (format === "html" && options.includeImagesInHtml) {
      const jpegBytes = await renderPageToJpeg(page, adapter.canvas, scale, 0.85);
      pageImages.push(`data:image/jpeg;base64,${bytesToBase64(jpegBytes)}`);
    }
  }

  if (format === "html") {
    const body = pages
      .map((p, i) => {
        const img =
          options.includeImagesInHtml && pageImages[i]
            ? `<img src="${pageImages[i]}" alt="Page ${p.pageNumber}" />`
            : "";
        return `<section><h2>Page ${p.pageNumber}</h2>${img}<pre>${p.lines.join("\n")}</pre></section>`;
      })
      .join("\n");
    return `<h1>Extracted PDF</h1>\n${body}`;
  }

  return pagesToPlainText(pages);
}
