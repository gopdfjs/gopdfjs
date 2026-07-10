/**
 * @gopdfjs/adapter — low-level host port contracts (adapter authors + engine only).
 *
 * `GopdfAdapter` = WASM · pdf.js · canvas · OCR bundle from `createBrowserAdapter()` /
 * `createNodeAdapter()`. **Only `@gopdfjs/engine` consumes it.**
 *
 * `Gopdf` interface is typed here but **implemented and exposed by engine** — products
 * import consumer types from `@gopdfjs/engine`, not this package.
 *
 * Plugins use `@gopdfjs/runtime` + `@gopdfjs/plugin`. Shared shapes: `@gopdfjs/model`.
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
