/**
 * @gopdfjs/runtime — API engine exposes to plugins.
 *
 * Engine calls `createGopdfRuntime(adapter)` (in `@gopdfjs/engine`) and passes the result
 * into `@gopdfjs/plugin-*` functions. Plugins import **only** this package (+ `@gopdfjs/plugin`).
 *
 * This package defines `GopdfRuntime` types only — it does not import `@gopdfjs/adapter` in prod.
 */

export type { GopdfRuntime } from "./runtime";

export type {
  CanvasSurface,
  PdfDocument,
  PdfPage,
  PdfTextContentItem,
  PdfViewport,
} from "./document";
