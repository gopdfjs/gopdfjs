import type { CanvasSurface, PdfDocument } from "@gopdfjs/model/document";

/** Allocates canvases for render pipelines — adapter-internal only. */
export interface CanvasPort {
  create(width: number, height: number): Promise<CanvasSurface>;
}

/** pdf.js document loader — adapter-internal only. */
export interface PdfJsRuntime {
  /**
   * Load a PDF without mutating or detaching `bytes`.
   * Implementations must clone before `getDocument({ data })`.
   */
  loadDocument(bytes: Uint8Array): Promise<PdfDocument>;
  getOps(): Promise<Record<string, number>>;
}

export type CreateCanvasPort = () => Promise<CanvasPort>;
export type CreatePdfJsRuntime = () => Promise<PdfJsRuntime>;
