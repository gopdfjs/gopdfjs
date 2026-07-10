import type { CanvasSurface, PdfDocument } from "@gopdfjs/model/document";

/**
 * Capability API that **engine** injects into plugins (`createGopdfRuntime` in `@gopdfjs/engine`).
 * Plugins call `runtime.loadDocument()` etc. — never `adapter.pdfjs` directly.
 */
export interface GopdfRuntime {
  loadDocument(bytes: Uint8Array): Promise<PdfDocument>;
  getPdfOps(): Promise<Record<string, number>>;
  createCanvas(width: number, height: number): Promise<CanvasSurface>;
}
