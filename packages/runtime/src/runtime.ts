import type { CanvasSurface, PdfDocument } from "./document";

/**
 * Plugin-facing capability API — engine constructs via `createGopdfRuntime(adapter)`.
 * Methods only; plugins never see adapter ports (`pdfjs` / `canvas` / `engine`).
 */
export interface GopdfRuntime {
  loadDocument(bytes: Uint8Array): Promise<PdfDocument>;
  getPdfOps(): Promise<Record<string, number>>;
  createCanvas(width: number, height: number): Promise<CanvasSurface>;
}
