import type { Gopdf } from "@gopdfjs/engine";
import type { ToolId } from "../config/toolIds";
import { ONE_PX_PNG } from "./onePxPng";

/** Minimal valid JPEG for jpgToPdf browser acceptance. */
const ONE_PX_JPEG = new Uint8Array([
  255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 255, 219, 0, 67, 0, 8,
  6, 6, 7, 6, 5, 8, 7, 7, 7, 9, 9, 8, 10, 12, 20, 13, 12, 11, 11, 12, 25, 18, 19, 15, 20, 29, 26,
  31, 30, 29, 26, 28, 28, 32, 36, 46, 39, 32, 34, 44, 35, 28, 28, 40, 55, 41, 44, 48, 49, 52, 52,
  52, 31, 39, 57, 61, 56, 50, 60, 46, 51, 52, 50, 255, 192, 0, 11, 8, 0, 1, 0, 1, 1, 1, 17, 0,
  255, 218, 0, 8, 1, 1, 0, 0, 63, 0, 127, 192, 128, 255, 217,
]);

export type ToolRunResult =
  | { kind: "pdf"; bytes: Uint8Array; summary: string }
  | { kind: "blob"; blob: Blob; filename: string; summary: string }
  | { kind: "text"; text: string; summary: string }
  | { kind: "json"; data: unknown; summary: string };

export type ToolInputKind = "pdf" | "html" | "markdown";

const DEMO_PASSWORD = "gopdf-demo";

/** Run one browser-facing engine tool with minimal valid args. */
export async function runBrowserTool(
  engine: Gopdf,
  toolId: ToolId,
  bytes: Uint8Array,
): Promise<ToolRunResult> {
  switch (toolId) {
    case "grayscale": {
      const result = await engine.grayscalePdf(bytes, { mode: "grayscale" });
      return {
        kind: "pdf",
        bytes: result.bytes,
        summary: `${result.inputPages}p → ${result.outputPages}p`,
      };
    }
    case "linearize": {
      const out = await engine.linearizePdf(bytes);
      return { kind: "pdf", bytes: out, summary: `${bytes.byteLength} → ${out.byteLength} bytes` };
    }
    case "merge": {
      const out = await engine.mergePdfs([bytes, bytes]);
      return { kind: "pdf", bytes: out, summary: `merged 2 inputs → ${out.byteLength} bytes` };
    }
    case "split": {
      const parts = await engine.splitPdf(bytes, [[0, 0]]);
      const out = parts[0] ?? bytes;
      return { kind: "pdf", bytes: out, summary: `${parts.length} part(s)` };
    }
    case "rotate": {
      const out = await engine.rotatePdf(bytes, 90, "all");
      return { kind: "pdf", bytes: out, summary: "rotated 90° all pages" };
    }
    case "organize": {
      const out = await engine.organizePdf(bytes, [0]);
      return { kind: "pdf", bytes: out, summary: "reordered pages" };
    }
    case "crop": {
      const out = await engine.cropPdf(bytes, { top: 0, bottom: 0, left: 0, right: 0 });
      return { kind: "pdf", bytes: out, summary: "zero-margin crop" };
    }
    case "protect": {
      const out = await engine.protectPdf(bytes, DEMO_PASSWORD);
      return { kind: "pdf", bytes: out, summary: "password applied" };
    }
    case "unlock": {
      const out = await engine.unlockPdf(bytes, DEMO_PASSWORD);
      return { kind: "pdf", bytes: out, summary: "unlock attempted" };
    }
    case "watermark": {
      const out = await engine.watermarkPdf(
        bytes,
        { text: "GoPDF.js" },
        {
          fontSize: 24,
          opacity: 0.3,
          rotation: 45,
          color: "#888888",
          tile: false,
          position: "center",
        },
      );
      return { kind: "pdf", bytes: out, summary: "text watermark" };
    }
    case "sign": {
      const out = await engine.signPdf(bytes, ONE_PX_PNG, {
        pageIndex: 0,
        x: 10,
        y: 10,
        width: 24,
        height: 24,
      });
      return { kind: "pdf", bytes: out, summary: "PNG stamp applied" };
    }
    case "halve": {
      const out = await engine.halvePdf(bytes, { orientation: "vertical" });
      return { kind: "pdf", bytes: out, summary: "vertical halve" };
    }
    case "n-up": {
      const out = await engine.nUpPdf(bytes, { layout: "2x2" });
      return { kind: "pdf", bytes: out, summary: "2×2 layout" };
    }
    case "page-numbers": {
      const out = await engine.addPageNumbers(bytes, {
        position: "bottom-center",
        startNumber: 1,
        fontSize: 10,
        prefix: "",
        suffix: "",
      });
      return { kind: "pdf", bytes: out, summary: "page numbers added" };
    }
    case "header-footer": {
      const out = await engine.addHeaderFooter(bytes, {
        header: "GoPDF.js",
        footer: "Acceptance",
        fontSize: 10,
        color: "#333333",
        margin: 24,
      });
      return { kind: "pdf", bytes: out, summary: "header/footer added" };
    }
    case "form-fill": {
      const out = await engine.fillPdfForm(bytes, {}, { flatten: false });
      return { kind: "pdf", bytes: out, summary: "form values applied" };
    }
    case "native-text-edit": {
      const out = await engine.applyNativeTextEdits(bytes, [
        {
          pageIndex: 0,
          x: 72,
          y: 720,
          width: 120,
          height: 14,
          fontSize: 12,
          text: "GoPDF.js",
        },
      ]);
      return { kind: "pdf", bytes: out, summary: "native text edit" };
    }
    case "apply-edits": {
      const out = await engine.applyEdits(bytes, []);
      return { kind: "pdf", bytes: out, summary: "0 annotations" };
    }
    case "redact": {
      const out = await engine.redactPdf(bytes, []);
      return { kind: "pdf", bytes: out, summary: "0 regions" };
    }
    case "repair": {
      const result = await engine.repairPdf(bytes);
      return {
        kind: "pdf",
        bytes: result.bytes,
        summary: `strategy ${result.report.strategy}`,
      };
    }
    case "pdf-to-jpeg": {
      const pages = await engine.pdfToJpeg(bytes, { scale: 0.5, quality: 0.8 });
      const first = pages[0]?.bytes ?? new Uint8Array();
      return { kind: "pdf", bytes: first, summary: `${pages.length} JPEG page(s)` };
    }
    case "pdf-to-text": {
      const text = await engine.pdfToText(bytes, { format: "txt" });
      return { kind: "text", text, summary: `${text.length} chars` };
    }
    case "extract-images": {
      const images = await engine.extractImages(bytes);
      return {
        kind: "json",
        data: { count: images.length },
        summary: `${images.length} image(s)`,
      };
    }
    case "extract-text-runs": {
      const runs = await engine.extractPdfTextRuns(bytes);
      return {
        kind: "json",
        data: { count: runs.length },
        summary: `${runs.length} run(s)`,
      };
    }
    case "pdf-to-word": {
      const blob = await engine.pdfToWord(bytes);
      return {
        kind: "blob",
        blob,
        filename: "output.docx",
        summary: `${blob.size} bytes docx`,
      };
    }
    case "pdf-to-excel": {
      const { blob } = await engine.pdfToExcel(bytes, { format: "csv" });
      return {
        kind: "blob",
        blob,
        filename: "output.csv",
        summary: `${blob.size} bytes csv`,
      };
    }
    case "pdf-to-ppt": {
      const blob = await engine.pdfToPpt(bytes, {
        pageIndices: [0],
        slideLayout: "16x9",
        template: "editable-only",
      });
      return {
        kind: "blob",
        blob,
        filename: "output.pptx",
        summary: `${blob.size} bytes pptx`,
      };
    }
    case "pdf-to-epub": {
      const blob = await engine.pdfToEpub(bytes, {
        metadata: { title: "GoPDF.js", author: "Acceptance" },
      });
      return {
        kind: "blob",
        blob,
        filename: "output.epub",
        summary: `${blob.size} bytes epub`,
      };
    }
    case "analyze": {
      const analysis = await engine.analyzePdf(bytes, { fileName: "fixture.pdf" });
      return {
        kind: "json",
        data: analysis,
        summary: `${analysis.pages} page(s)`,
      };
    }
    case "jpg-to-pdf": {
      const out = await engine.jpgToPdf([{ bytes: ONE_PX_JPEG, mimeType: "image/jpeg" }]);
      return { kind: "pdf", bytes: out, summary: "1 image → PDF" };
    }
    default:
      throw new Error(`runBrowserTool does not handle ${toolId}`);
  }
}

export async function runAuthorTool(
  engine: Gopdf,
  toolId: Extract<ToolId, "html-to-pdf" | "markdown-to-html">,
  source: string,
): Promise<ToolRunResult> {
  if (toolId === "html-to-pdf") {
    const result = await engine.htmlToPdf(source, {
      pageSize: "a4",
      orientation: "portrait",
      margin: "normal",
      background: true,
    });
    return {
      kind: "pdf",
      bytes: result.bytes,
      summary: `${result.pageCount} page(s)`,
    };
  }
  const html = await engine.markdownToHtml(source);
  return { kind: "text", text: html, summary: `${html.length} chars html` };
}

export function toolInputKind(toolId: ToolId): ToolInputKind {
  if (toolId === "html-to-pdf") return "html";
  if (toolId === "markdown-to-html") return "markdown";
  return "pdf";
}

export function defaultAuthorSource(toolId: ToolId): string {
  if (toolId === "markdown-to-html") return "# GoPDF.js\n\nBrowser acceptance.";
  return "<!doctype html><html><body><h1>GoPDF.js</h1></body></html>";
}
