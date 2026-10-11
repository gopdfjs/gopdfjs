import type { CompressionLevel, GopdfEngine, ImageFormat } from "./engine";
import type {
  Annotation,
  BatchPdfInput,
  BatchRepairResult,
  GrayscalePdfOptions,
  GrayscalePdfResult,
  ImageInput,
  PdfAnalysisMeta,
  PdfAnalysisResult,
  PdfTextRun,
  HtmlToPdfOptions,
  HtmlToPdfResult,
  ComparePdfTextOptions,
  CompareSession,
  TextDiffResult,
  VisualDiffResult,
  RedactPdfOptions,
  RedactRegion,
  RepairPdfOptions,
  RepairPdfResult,
  SignPlacement,
  WatermarkImage,
  WatermarkPosition,
} from "@gopdfjs/plugin/domain";
import type { GopdfAdapter } from "./adapter";

export type { GopdfAdapter } from "./adapter";

export type PdfToJpegOptions = {
  quality?: number;
  scale?: number;
};

export type PdfJpegPage = {
  bytes: Uint8Array;
  page: number;
};

export type PdfToTextFormat = "txt" | "html" | "rtf";

export type PdfToTextOptions = {
  format?: PdfToTextFormat;
  includeImagesInHtml?: boolean;
  renderScale?: number;
};

/** RFC 0055 — one merged PDF, or a ZIP of one PDF per converted entry. */
export const ZIP_TO_PDF_MODE = {
  combined: "combined",
  individual: "individual",
} as const;

export type ZipToPdfMode = (typeof ZIP_TO_PDF_MODE)[keyof typeof ZIP_TO_PDF_MODE];

/** Per-entry outcome. A failed or unsupported entry does not stop the rest of the archive. */
export const ZIP_ENTRY_STATUS = {
  converted: "converted",
  unsupported: "unsupported",
  failed: "failed",
} as const;

export type ZipEntryStatus = (typeof ZIP_ENTRY_STATUS)[keyof typeof ZIP_ENTRY_STATUS];

export type ZipToPdfEntryResult = {
  /** Archive-relative path after `\` → `/` and `.` / `..` checks. */
  path: string;
  status: ZipEntryStatus;
  /** PDF name inside an individual-mode ZIP, or the source name merged in combined mode. */
  outputPath?: string;
  message?: string;
};

export type ZipToPdfOptions = {
  mode: ZipToPdfMode;
  /** Called after each file entry, in deterministic path order. `index` is 0-based. */
  onEntry?: (entry: ZipToPdfEntryResult, index: number, total: number) => void;
};

export type ZipToPdfResult = {
  mode: ZipToPdfMode;
  /**
   * Combined mode: one PDF. When nothing converted, pdf-lib reloads that merge as one blank page.
   * Individual mode: ZIP of converted PDFs, nested paths preserved.
   */
  bytes: Uint8Array;
  entries: ZipToPdfEntryResult[];
};

/**
 * Consumer-facing PDF API (`engine.compressPdf()`, …).
 * **Type lives here; implementation lives in `@gopdfjs/engine` `createEngine()`**, which
 * wires `@gopdfjs/plugin-*` functions onto this facade. Do not import from apps — use
 * `@gopdfjs/engine`. Does **not** expose `adapter`, `loadDocument`, or `encodeImages`.
 */
export interface Gopdf {
  // —— WASM / core ——
  compressPdf(
    bytes: Uint8Array,
    level: CompressionLevel,
    onProgress?: (fraction: number) => void,
  ): Promise<Uint8Array>;

  linearizePdf(bytes: Uint8Array): Promise<Uint8Array>;

  // —— render / extract ——
  pdfToJpeg(bytes: Uint8Array, options?: PdfToJpegOptions): Promise<PdfJpegPage[]>;

  pdfToText(
    bytes: Uint8Array,
    options?: PdfToTextOptions,
    onProgress?: (current: number, total: number) => void,
  ): Promise<string>;

  /** Requires `adapter.ocr` on the host adapter. */
  ocr(
    bytes: Uint8Array,
    lang?: string,
    onProgress?: (fraction: number) => void,
  ): Promise<string>;

  // —— raster tools ——
  grayscalePdf(
    bytes: Uint8Array,
    options: GrayscalePdfOptions,
    onProgress?: (current: number, total: number) => void,
  ): Promise<GrayscalePdfResult>;

  redactPdf(
    bytes: Uint8Array,
    regions: RedactRegion[],
    options?: RedactPdfOptions,
    onProgress?: (current: number, total: number) => void,
  ): Promise<Uint8Array>;

  // —— structural (pdf-lib) ——
  mergePdfs(inputs: Uint8Array[]): Promise<Uint8Array>;

  splitPdf(bytes: Uint8Array, ranges: number[][]): Promise<Uint8Array[]>;

  rotatePdf(
    bytes: Uint8Array,
    rotation: 90 | 180 | 270,
    pageIndices: number[] | "all",
  ): Promise<Uint8Array>;

  protectPdf(bytes: Uint8Array, password: string): Promise<Uint8Array>;

  unlockPdf(bytes: Uint8Array, password: string): Promise<Uint8Array>;

  organizePdf(bytes: Uint8Array, order: number[]): Promise<Uint8Array>;

  cropPdf(
    bytes: Uint8Array,
    margins: { top: number; bottom: number; left: number; right: number },
  ): Promise<Uint8Array>;

  jpgToPdf(images: ImageInput[]): Promise<Uint8Array>;

  /**
   * RFC 0055. Converts JPEG, PNG, PDF, plain text, Markdown, and HTML entries.
   * Office files are unsupported and reported per entry. Text, Markdown, and HTML
   * use `htmlToPdf` (browser DOM). JPEG/PNG/PDF work in Node and the browser.
   */
  zipToPdf(bytes: Uint8Array, options: ZipToPdfOptions): Promise<ZipToPdfResult>;

  watermarkPdf(
    bytes: Uint8Array,
    content: { text?: string; image?: WatermarkImage },
    opts: {
      fontSize: number;
      opacity: number;
      rotation: number;
      color: string;
      tile: boolean;
      position: WatermarkPosition;
    },
  ): Promise<Uint8Array>;

  signPdf(bytes: Uint8Array, pngBytes: Uint8Array, placement: SignPlacement): Promise<Uint8Array>;

  halvePdf(
    bytes: Uint8Array,
    opts: { orientation: "vertical" | "horizontal"; splitRatio?: number },
  ): Promise<Uint8Array>;

  nUpPdf(
    bytes: Uint8Array,
    opts: {
      layout: "1x2" | "2x1" | "2x2" | "2x3" | "4x4";
      sortOrder?: "z-order" | "n-order";
      margin?: number;
      outerMargin?: number;
    },
  ): Promise<Uint8Array>;

  resizePdf(
    bytes: Uint8Array,
    options: {
      target:
        | { preset: "a4" | "letter" | "legal" | "tabloid" }
        | { preset: "custom"; widthMm: number; heightMm: number };
      mode: "fit" | "fill" | "stretch";
      scope: "uniform" | "perPage";
    },
  ): Promise<Uint8Array>;

  reversePdf(bytes: Uint8Array): Promise<Uint8Array>;

  addHeaderFooter(
    bytes: Uint8Array,
    opts: { header: string; footer: string; fontSize: number; color: string; margin: number },
  ): Promise<Uint8Array>;

  addPageNumbers(
    bytes: Uint8Array,
    opts: {
      position:
        | "top-left" | "top-center" | "top-right"
        | "bottom-left" | "bottom-center" | "bottom-right";
      startNumber: number;
      fontSize: number;
      prefix: string;
      suffix: string;
      color?: string;
    },
  ): Promise<Uint8Array>;

  // —— repair ——
  repairPdf(
    bytes: Uint8Array,
    options?: RepairPdfOptions,
    onProgress?: (current: number, total: number) => void,
  ): Promise<RepairPdfResult>;

  repairPdfBatch(
    inputs: BatchPdfInput[],
    options?: RepairPdfOptions,
    onFileProgress?: (fileIndex: number, fileCount: number, fileName: string) => void,
    onPageProgress?: (current: number, total: number) => void,
  ): Promise<BatchRepairResult>;

  // —— extract ——
  extractImages(bytes: Uint8Array): Promise<{ blob: Blob; name: string; page: number }[]>;

  extractPdfTextRuns(
    bytes: Uint8Array,
    onProgress?: (current: number, total: number) => void,
  ): Promise<PdfTextRun[]>;

  pdfToWord(
    bytes: Uint8Array,
    onProgress?: (current: number, total: number) => void,
  ): Promise<Blob>;

  // —— inspect ——
  analyzePdf(bytes: Uint8Array, meta?: PdfAnalysisMeta): Promise<PdfAnalysisResult>;

  // —— annotate ——
  applyEdits(bytes: Uint8Array, annotations: Annotation[]): Promise<Uint8Array>;

  applyNativeTextEdits(
    bytes: Uint8Array,
    edits: Array<{
      pageIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize: number;
      text: string;
      color?: { r: number; g: number; b: number };
      bold?: boolean;
    }>,
  ): Promise<Uint8Array>;

  fillPdfForm(
    bytes: Uint8Array,
    values: Record<string, string | boolean>,
    options?: { flatten?: boolean },
    fieldsForValidation?: Array<{ name: string; required?: boolean; kind: string; value: unknown }>,
  ): Promise<Uint8Array>;

  pdfToExcel(
    bytes: Uint8Array,
    exportOptions: { format: "xlsx" | "csv"; sheetMode?: string },
    onProgress?: (progress: { current: number; total: number }) => void,
  ): Promise<{ blob: Blob; analysis: unknown }>;

  pdfToPpt(
    bytes: Uint8Array,
    options: {
      pageIndices: number[];
      slideLayout: string;
      template: string;
    },
    onProgress?: (progress: { current: number; total: number }) => void,
  ): Promise<Blob>;

  pdfToEpub(
    bytes: Uint8Array,
    options: {
      metadata: { title: string; author: string };
      devicePreset?: string;
      coverImage?: Uint8Array;
    },
    onProgress?: (current: number, total: number) => void,
  ): Promise<Blob>;

  /** Browser-only — requires DOM (`document`, html2canvas). */
  htmlToPdf(
    html: string,
    options?: HtmlToPdfOptions,
    onProgress?: (percent: number, step: string) => void,
  ): Promise<HtmlToPdfResult>;

  /** Browser-only — compile Markdown to sanitized HTML for `htmlToPdf()`. */
  markdownToHtml(source: string): Promise<string>;

  // —— compare (RFC 0053) ——
  comparePdfText(
    bytesA: Uint8Array,
    bytesB: Uint8Array,
    options?: ComparePdfTextOptions,
  ): Promise<TextDiffResult>;

  /** Browser-only — dual-pane compare viewer session. */
  createCompareSession(bytesA: Uint8Array, bytesB: Uint8Array): Promise<CompareSession>;

  /** Browser-only — pixel diff between two same-size canvases. */
  visualDiffCanvases(
    canvasA: HTMLCanvasElement,
    canvasB: HTMLCanvasElement,
  ): VisualDiffResult;
}

export type CreateGopdf = (adapter: GopdfAdapter) => Gopdf;

/** WASM port inside `GopdfAdapter.engine` — not the unified facade. */
export type { GopdfEngine };
