/** Shared option/result shapes for `Gopdf` — no implementations. */

export type GrayscaleMode = "grayscale" | "bw";

export type GrayscalePdfOptions = {
  mode: GrayscaleMode;
  renderScale?: number;
  jpegQuality?: number;
};

export type GrayscalePdfResult = {
  bytes: Uint8Array;
  inputPages: number;
  outputPages: number;
  inputBytes: number;
  outputBytes: number;
};

export type RedactRegion = {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RedactPdfOptions = {
  scrubMetadata?: boolean;
};

export type PdfAnalysisMeta = {
  fileName?: string;
  fileSizeBytes?: number;
};

export type PdfAnalysisResult = {
  fileName: string;
  fileSizeStr: string;
  pages: number;
  title: string;
  author: string;
  creator: string;
  producer: string;
  creationDate: string;
  modDate: string;
  isEncrypted: boolean;
  version: string;
  isLinearized: boolean;
  fontCount: number;
  imageCount: number;
  formCount: number;
  imageRawSizeMb: string;
  pageDetails: { width: number; height: number; label: string }[];
  fonts: string[];
  permissions: {
    printing: "allowed" | "not-allowed";
    modifying: "allowed" | "not-allowed";
    copying: "allowed" | "not-allowed";
    annotating: "allowed" | "not-allowed";
  };
};

export type AnnotationImage = { bytes: Uint8Array; mimeType: string };

export type Annotation = {
  id: string;
  type: "text" | "image" | "rect" | "ellipse" | "line";
  pageIndex: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  image?: AnnotationImage;
  fontSize?: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
};

export type WatermarkImage = { bytes: Uint8Array; mimeType: string };

export type WatermarkPosition =
  | "top-left" | "top-center" | "top-right"
  | "center-left" | "center" | "center-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export type ImageInput = { bytes: Uint8Array; mimeType: string };

export type SignPlacement = {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RepairPdfOptions = {
  password?: string;
};

export type RepairPdfResult = {
  bytes: Uint8Array;
  report: {
    strategy: string;
    inputPages: number | null;
    outputPages: number;
    warnings: string[];
    validated: boolean;
  };
};

export type BatchPdfInput = { fileName: string; bytes: Uint8Array };

export type BatchRepairResult = {
  items: Array<{ fileName: string; ok: boolean; result?: RepairPdfResult; errorMessage?: string }>;
  successCount: number;
};

export type PdfTextRun = {
  id: string;
  pageIndex: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
};

/** Browser-only HTML → PDF (via `@gopdfjs/plugin-author`). */
export type HtmlToPdfPageSize = "a4" | "letter";
export type HtmlToPdfOrientation = "portrait" | "landscape";
export type HtmlToPdfMargin = "none" | "normal" | "wide";

export type HtmlToPdfOptions = {
  pageSize: HtmlToPdfPageSize;
  orientation: HtmlToPdfOrientation;
  margin: HtmlToPdfMargin;
  background: boolean;
};

export type HtmlToPdfResult = {
  bytes: Uint8Array;
  pageCount: number;
  truncated: boolean;
};

/** Dual-document PDF compare (RFC 0053) — consumer API on `Gopdf`. */
export type ComparePdfTextOptions = {
  displayScale?: number;
};

export type PdfRect = { x: number; y: number; width: number; height: number; pageIndex: number };

export type TextChangeItem = {
  pageIndex: number;
  kind: "delete" | "insert";
  text: string;
};

export type PagePairRender = {
  canvasA: HTMLCanvasElement | null;
  canvasB: HTMLCanvasElement | null;
  widthPx: number;
  heightPx: number;
  scale: number;
};

export type VisualDiffResult = {
  diffCanvas: HTMLCanvasElement;
  changedPixels: number;
};

export type TextDiffResult = {
  rectsA: PdfRect[];
  rectsB: PdfRect[];
  changes: TextChangeItem[];
  hasTextLayer: boolean;
};

/** Browser-only interactive compare viewer session (`Gopdf.createCompareSession`). */
export interface CompareSession {
  readonly pageCount: number;
  diffText(options?: ComparePdfTextOptions): Promise<TextDiffResult>;
  getPagePair(pageIndex: number): Promise<PagePairRender>;
  getVisualDiff(pageIndex: number): Promise<VisualDiffResult | null>;
  evictOutside(centerPageIndex: number): void;
  clear(): void;
}
