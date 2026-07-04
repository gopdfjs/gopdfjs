import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { pdfjs } from "@gopdfjs/render";
import { createCanvas, canvasToBytes } from "@gopdfjs/render/canvas";
import { TEXT_RUN_LINE_Y_TOLERANCE_PT } from "../textRuns";
import {
  TEXT_EXPORT_FORMAT,
  extensionForFormat,
  mimeTypeForFormat,
  pagesToHtml,
  pagesToPlainText,
  pagesToRtf,
  sanitizeHtml,
  type ExtractedPageText,
  type TextExportFormat,
} from "./formatters";

export {
  TEXT_EXPORT_FORMAT,
  extensionForFormat,
  mimeTypeForFormat,
  pagesToHtml,
  pagesToPlainText,
  pagesToRtf,
  sanitizeHtml,
  type ExtractedPageText,
  type TextExportFormat,
} from "./formatters";

export interface PdfToTextOptions {
  format: TextExportFormat;
  /** When true, embed rendered page images in HTML output. */
  includeImagesInHtml?: boolean;
  renderScale?: number;
}

/**
 * Helper to group individual text runs/items into lines based on their vertical Y coordinate alignment.
 * @param items - List of text elements extracted from PDF.
 */
function groupItemsIntoLines(items: TextItem[]): string[] {
  const lines: Array<{ y: number; parts: Array<{ x: number; text: string }> }> = [];

  for (const item of items) {
    if (!item.str.trim()) continue;
    const y = item.transform[5];
    const x = item.transform[4];
    // Find an existing line with a vertical coordinate close to this item's coordinate
    const existing = lines.find((line) => Math.abs(line.y - y) <= TEXT_RUN_LINE_Y_TOLERANCE_PT);
    if (existing) {
      existing.parts.push({ x, text: item.str });
    } else {
      lines.push({ y, parts: [{ x, text: item.str }] });
    }
  }

  // Sort lines from top of the page to the bottom
  lines.sort((a, b) => b.y - a.y);
  return lines.map((line) => {
    // Sort items horizontally from left to right within each line
    line.parts.sort((a, b) => a.x - b.x);
    return line.parts.map((part) => part.text).join(" ").trim();
  }).filter(Boolean);
}

/**
 * Safe base64 conversion helper for both Node.js and browser environments.
 * @param bytes - Binary data buffer.
 */
function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
}

/**
 * Renders a PDF page offscreen to a base64-encoded Data URL using the @gopdfjs/render/canvas module.
 * @param page - PDFPageProxy loaded page.
 * @param scale - Screen-rendering scaling factor.
 */
async function renderPageDataUrl(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof pdfjs.getDocument>>["getPage"]>>,
  scale: number,
): Promise<string> {
  // Compute target display resolution viewport
  const viewport = page.getViewport({ scale });
  // Create an offscreen Node-native canvas
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  // Render the PDF page visually into the offscreen canvas context
  await page.render({ canvasContext: ctx, viewport }).promise;
  // Convert canvas contents back to a compressed JPEG byte buffer
  const bytes = await canvasToBytes(canvas, "image/jpeg", 0.85);
  // Convert bytes safely to base64 encoding
  const base64 = bytesToBase64(bytes);
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * Extract PDF text and export as plain TXT, RTF, or sanitized HTML.
 * Optimized for isomorphic/pure Node.js compatibility by accepting raw Uint8Array and returning string.
 * @param pdfBytes - Raw PDF binary array.
 * @param options - Text export formatting configurations.
 * @param onProgress - Optional progression hook.
 */
export async function pdfToText(
  pdfBytes: Uint8Array,
  options: PdfToTextOptions,
  onProgress?: (current: number, total: number) => void,
): Promise<string> {
  // Load PDF file directly from binary memory buffer
  const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
  const pages: ExtractedPageText[] = [];
  const pageImages: string[] = [];
  const scale = options.renderScale ?? 1.5;

  // Process pages sequentially to extract textual components
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(pageNum, pdf.numPages);
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent({ includeMarkedContent: false });
    const items = content.items.filter(
      (item): item is TextItem => "str" in item && item.str.trim().length > 0,
    );
    pages.push({ pageNumber: pageNum, lines: groupItemsIntoLines(items) });

    // When exporting HTML output, embed visual snapshots of each page
    if (options.format === TEXT_EXPORT_FORMAT.HTML && options.includeImagesInHtml) {
      pageImages.push(await renderPageDataUrl(page, scale));
    }
  }

  let payload: string;
  if (options.format === TEXT_EXPORT_FORMAT.RTF) {
    // Return RTF formatted document
    payload = pagesToRtf(pages);
  } else if (options.format === TEXT_EXPORT_FORMAT.HTML) {
    // Return sanitized HTML markup with page elements
    payload = sanitizeHtml(
      pagesToHtml(pages, {
        title: "Extracted PDF",
        includeImages: options.includeImagesInHtml,
        pageImages,
      }),
    );
  } else {
    // Return simple plain text output with Minimal "--- Page X ---" headers
    payload = pagesToPlainText(pages);
  }

  return payload;
}
