/**
 * @gopdfjs/runtime — runtime capability contracts (no fs, no DOM, no WASM, no adapter).
 *
 * Engine constructs `GopdfRuntime` from `GopdfAdapter` and injects into feature plugins.
 * Plugins import **only** this package for `GopdfRuntime` / document types.
 */

export type { GopdfRuntime } from "./runtime";

export type {
  CanvasSurface,
  PdfDocument,
  PdfPage,
  PdfTextContentItem,
  PdfViewport,
} from "./document";
