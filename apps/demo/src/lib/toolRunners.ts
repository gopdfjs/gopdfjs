import type { Gopdf } from "@gopdfjs/engine";
import type { ToolId } from "../config/toolIds";
import type { DemoContext } from "./demoContext";
import { ONE_PX_PNG } from "./onePxPng";

export type ToolRunResult =
  | { kind: "pdf"; bytes: Uint8Array; summary: string }
  | { kind: "blob"; blob: Blob; filename: string; summary: string }
  | { kind: "text"; text: string; summary: string }
  | { kind: "json"; data: unknown; summary: string }
  | { kind: "jpeg-pages"; pages: { bytes: Uint8Array; page: number }[]; summary: string }
  | { kind: "images"; items: { blob: Blob; name: string; page: number }[]; summary: string };

const DEMO_PASSWORD_DEFAULT = "gopdf-demo";

/** Copy bytes so WASM/worker cannot detach the demo's retained buffers. */
function ownBytes(bytes: Uint8Array): Uint8Array {
  return bytes.slice();
}

function cloneDemoContext(ctx: DemoContext): DemoContext {
  return {
    ...ctx,
    pdfBytes: ctx.pdfBytes ? ownBytes(ctx.pdfBytes) : undefined,
    pdfBytesList: ctx.pdfBytesList?.map(ownBytes),
    images: ctx.images?.map((image) => ({
      ...image,
      bytes: ownBytes(image.bytes),
    })),
    stampBytes: ctx.stampBytes ? ownBytes(ctx.stampBytes) : undefined,
  };
}

function pdfResult(bytes: Uint8Array, summary: string): ToolRunResult {
  return { kind: "pdf", bytes: ownBytes(bytes), summary };
}

function requirePdf(ctx: DemoContext): Uint8Array {
  if (!ctx.pdfBytes?.byteLength) {
    throw new Error("Upload a PDF first.");
  }
  return ctx.pdfBytes;
}

function requirePdfs(ctx: DemoContext, min = 2): Uint8Array[] {
  const list = ctx.pdfBytesList?.filter((b) => b.byteLength) ?? [];
  if (list.length < min) {
    throw new Error(`Add at least ${min} PDF(s).`);
  }
  return list;
}

function requireImages(ctx: DemoContext): DemoContext["images"] {
  const images = ctx.images?.filter((img) => img.bytes.byteLength) ?? [];
  if (images.length === 0) {
    throw new Error("Upload at least one JPEG or PNG.");
  }
  return images;
}

/** Run one browser-facing engine tool with demo-supplied inputs. */
export async function runToolDemo(
  engine: Gopdf,
  toolId: ToolId,
  ctx: DemoContext,
): Promise<ToolRunResult> {
  const ownedCtx = cloneDemoContext(ctx);
  switch (toolId) {
    case "grayscale": {
      const bytes = requirePdf(ownedCtx);
      const result = await engine.grayscalePdf(bytes, { mode: "grayscale" });
      return pdfResult(result.bytes, `${result.inputPages}p → ${result.outputPages}p`);
    }
    case "linearize": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.linearizePdf(bytes);
      return pdfResult(out, `${bytes.byteLength} → ${out.byteLength} bytes`);
    }
    case "merge": {
      const inputs = requirePdfs(ownedCtx);
      const out = await engine.mergePdfs(inputs);
      return pdfResult(out, `merged ${inputs.length} PDFs → ${out.byteLength} bytes`);
    }
    case "split": {
      const bytes = requirePdf(ownedCtx);
      const parts = await engine.splitPdf(bytes, [[0, 0]]);
      const out = parts[0] ?? bytes;
      return pdfResult(out, `${parts.length} part(s) — showing part 1`);
    }
    case "rotate": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.rotatePdf(bytes, 90, "all");
      return pdfResult(out, "rotated 90° on all pages");
    }
    case "organize": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.organizePdf(bytes, [0]);
      return pdfResult(out, "kept page 1 only");
    }
    case "crop": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.cropPdf(bytes, { top: 0, bottom: 0, left: 0, right: 0 });
      return pdfResult(out, "zero-margin crop");
    }
    case "protect": {
      const bytes = requirePdf(ownedCtx);
      const password = ownedCtx.password?.trim() || DEMO_PASSWORD_DEFAULT;
      const out = await engine.protectPdf(bytes, password);
      return pdfResult(out, `encrypted with password "${password}"`);
    }
    case "unlock": {
      const bytes = requirePdf(ownedCtx);
      const password = ownedCtx.password?.trim() || DEMO_PASSWORD_DEFAULT;
      const out = await engine.unlockPdf(bytes, password);
      return pdfResult(out, `decrypted with password "${password}"`);
    }
    case "watermark": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.watermarkPdf(
        bytes,
        { text: "GoPDF.js demo" },
        {
          fontSize: 24,
          opacity: 0.3,
          rotation: 45,
          color: "#888888",
          tile: false,
          position: "center",
        },
      );
      return pdfResult(out, "center text watermark");
    }
    case "sign": {
      const bytes = requirePdf(ownedCtx);
      const stamp = ownedCtx.stampBytes ?? ONE_PX_PNG;
      const out = await engine.signPdf(bytes, stamp, {
        pageIndex: 0,
        x: 72,
        y: 72,
        width: 96,
        height: 96,
      });
      return pdfResult(out, "PNG stamp on page 1");
    }
    case "halve": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.halvePdf(bytes, { orientation: "vertical" });
      return pdfResult(out, "vertical halve");
    }
    case "n-up": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.nUpPdf(bytes, { layout: "2x2" });
      return pdfResult(out, "2×2 n-up layout");
    }
    case "page-numbers": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.addPageNumbers(bytes, {
        position: "bottom-center",
        startNumber: 1,
        fontSize: 10,
        prefix: "",
        suffix: "",
      });
      return pdfResult(out, "page numbers added");
    }
    case "header-footer": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.addHeaderFooter(bytes, {
        header: "GoPDF.js",
        footer: "Demo",
        fontSize: 10,
        color: "#333333",
        margin: 24,
      });
      return pdfResult(out, "header + footer added");
    }
    case "form-fill": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.fillPdfForm(bytes, {}, { flatten: false });
      return pdfResult(out, "form fill (empty values)");
    }
    case "native-text-edit": {
      const bytes = requirePdf(ownedCtx);
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
      return pdfResult(out, "native text overlay on page 1");
    }
    case "apply-edits": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.applyEdits(bytes, []);
      return pdfResult(out, "annotation pass (0 edits)");
    }
    case "redact": {
      const bytes = requirePdf(ownedCtx);
      const out = await engine.redactPdf(bytes, []);
      return pdfResult(out, "redact pass (0 regions)");
    }
    case "repair": {
      const bytes = requirePdf(ownedCtx);
      const result = await engine.repairPdf(bytes);
      return pdfResult(result.bytes, `repair via ${result.report.strategy}`);
    }
    case "pdf-to-jpeg": {
      const bytes = requirePdf(ownedCtx);
      const pages = await engine.pdfToJpeg(bytes, { scale: 0.75, quality: 0.85 });
      return {
        kind: "jpeg-pages",
        pages: pages.map((p) => ({ bytes: ownBytes(p.bytes), page: p.page })),
        summary: `${pages.length} JPEG page(s)`,
      };
    }
    case "pdf-to-text": {
      const bytes = requirePdf(ownedCtx);
      const text = await engine.pdfToText(bytes, { format: "txt" });
      return { kind: "text", text, summary: `${text.length} characters extracted` };
    }
    case "extract-images": {
      const bytes = requirePdf(ownedCtx);
      const images = await engine.extractImages(bytes);
      return {
        kind: "images",
        items: images.map((img) => ({ blob: img.blob, name: img.name, page: img.page })),
        summary: `${images.length} embedded image(s)`,
      };
    }
    case "extract-text-runs": {
      const bytes = requirePdf(ownedCtx);
      const runs = await engine.extractPdfTextRuns(bytes);
      return {
        kind: "json",
        data: runs.slice(0, 20),
        summary: `${runs.length} text run(s) — showing first 20`,
      };
    }
    case "pdf-to-word": {
      const bytes = requirePdf(ownedCtx);
      const blob = await engine.pdfToWord(bytes);
      return { kind: "blob", blob, filename: "output.docx", summary: `${blob.size} byte DOCX` };
    }
    case "pdf-to-excel": {
      const bytes = requirePdf(ownedCtx);
      const { blob } = await engine.pdfToExcel(bytes, { format: "csv" });
      return { kind: "blob", blob, filename: "output.csv", summary: `${blob.size} byte CSV` };
    }
    case "pdf-to-ppt": {
      const bytes = requirePdf(ownedCtx);
      const blob = await engine.pdfToPpt(bytes, {
        pageIndices: [0],
        slideLayout: "16x9",
        template: "editable-only",
      });
      return { kind: "blob", blob, filename: "output.pptx", summary: `${blob.size} byte PPTX` };
    }
    case "pdf-to-epub": {
      const bytes = requirePdf(ownedCtx);
      const blob = await engine.pdfToEpub(bytes, {
        metadata: { title: "GoPDF.js demo", author: "Acceptance" },
      });
      return { kind: "blob", blob, filename: "output.epub", summary: `${blob.size} byte EPUB` };
    }
    case "analyze": {
      const bytes = requirePdf(ownedCtx);
      const analysis = await engine.analyzePdf(bytes, { fileName: "demo.pdf" });
      return {
        kind: "json",
        data: analysis,
        summary: `${analysis.pages} page(s) · ${analysis.imageCount} images`,
      };
    }
    case "jpg-to-pdf": {
      const images = requireImages(ownedCtx)!;
      const out = await engine.jpgToPdf(
        images.map((img) => ({ bytes: img.bytes, mimeType: img.mimeType })),
      );
      return pdfResult(out, `${images.length} image(s) → PDF (${out.byteLength} bytes)`);
    }
    case "html-to-pdf": {
      const source = ownedCtx.textSource?.trim();
      if (!source) throw new Error("Enter HTML source.");
      const result = await engine.htmlToPdf(source, {
        pageSize: "a4",
        orientation: "portrait",
        margin: "normal",
        background: true,
      });
      return pdfResult(result.bytes, `${result.pageCount} page(s)`);
    }
    case "markdown-to-html": {
      const source = ownedCtx.textSource?.trim();
      if (!source) throw new Error("Enter Markdown source.");
      const html = await engine.markdownToHtml(source);
      return { kind: "text", text: html, summary: `${html.length} chars HTML` };
    }
    default:
      throw new Error(`runToolDemo does not handle ${toolId}`);
  }
}

export const DEFAULT_MARKDOWN = "# GoPDF.js\n\nBrowser demo for **markdownToHtml**.";
export const DEFAULT_HTML =
  "<!doctype html><html><body><h1>GoPDF.js</h1><p>Browser demo for htmlToPdf.</p></body></html>";

/** @deprecated use demoKindFor + dedicated panels */
export function toolInputKind(toolId: ToolId): "pdf" | "html" | "markdown" {
  if (toolId === "html-to-pdf") return "html";
  if (toolId === "markdown-to-html") return "markdown";
  if (toolId === "jpg-to-pdf") return "pdf";
  return "pdf";
}

/** @deprecated */
export const runBrowserTool = runToolDemo;
/** @deprecated */
export const runAuthorTool = (
  engine: Gopdf,
  toolId: Extract<ToolId, "html-to-pdf" | "markdown-to-html">,
  source: string,
) => runToolDemo(engine, toolId, { textSource: source });

export function defaultAuthorSource(toolId: ToolId): string {
  if (toolId === "markdown-to-html") return DEFAULT_MARKDOWN;
  if (toolId === "html-to-pdf") return DEFAULT_HTML;
  return "";
}
