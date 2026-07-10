/**
 * @gopdfjs/adapter — adapter contracts only (no fs, no DOM, no WASM impl).
 *
 * ## Async by default
 * - Factories return `Promise<…>` (`CreateGopdfAdapter`, `CreateGopdfEngine`, …).
 * - Port methods that touch I/O, WASM, canvas encode, pdf.js, or OCR return `Promise`.
 * - `onProgress` callbacks stay sync (event channel).
 *
 * ## Consumer entry (RFC 0058 §2.4)
 * ```ts
 * import { createEngine } from "@gopdfjs/engine";
 * import { createBrowserAdapter } from "@gopdfjs/adapter-browser";
 * const engine = createEngine(await createBrowserAdapter());
 * await engine.pdfToJpeg(pdfBytes);
 * ```
 *
 * Plugins import `@gopdfjs/runtime` + `@gopdfjs/plugin` — never this package.
 */

export type {
  CompressionLevel,
  CreateGopdfEngine,
  GopdfEngine,
  ImageFormat,
} from "./engine";

export type { CreateOcrPort, OcrPort } from "./ocr";

export type {
  CanvasPort,
  CreateCanvasPort,
  CreatePdfJsRuntime,
  PdfJsRuntime,
} from "./render";

export type {
  CreateGopdfAdapter,
  CreateGopdfRuntime,
  GopdfAdapter,
} from "./adapter";

export { clonePdfBytes, assertPdfBytesReadable, detachArrayBuffer } from "./bytes";

export type {
  CreateGopdf,
  Gopdf,
  PdfJpegPage,
  PdfToJpegOptions,
  PdfToTextFormat,
  PdfToTextOptions,
} from "./gopdf";
