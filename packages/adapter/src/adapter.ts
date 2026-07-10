import type { GopdfEngine } from "./engine";
import type { CanvasPort, PdfJsRuntime } from "./render";
import type { OcrPort } from "./ocr";

/**
 * Low-level host env bundle — `createBrowserAdapter()` / `createNodeAdapter()`.
 * Passed to `createEngine(adapter)`. **Engine only** — plugins never import this type.
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
