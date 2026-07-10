import type { GopdfEngine } from "./engine";
import type { CanvasPort, PdfJsRuntime } from "./render";
import type { OcrPort } from "./ocr";

/**
 * Host env bundle — `createBrowserAdapter()` / `createNodeAdapter()` → `createEngine(adapter)`.
 * Adapter packages only; plugins must not import or depend on this type.
 */
export interface GopdfAdapter {
  readonly engine: GopdfEngine;
  readonly pdfjs: PdfJsRuntime;
  readonly canvas: CanvasPort;
  /** Present on Node CLI; omit in browser-only hosts. */
  readonly ocr?: OcrPort;
}

/** Single async entry — initializes WASM, pdf.js, canvas backend before use. */
export type CreateGopdfAdapter = () => Promise<GopdfAdapter>;

/** @deprecated Use `CreateGopdfAdapter`. */
export type CreateGopdfRuntime = CreateGopdfAdapter;
