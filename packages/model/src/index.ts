/**
 * @gopdfjs/model — shared PDF document/canvas shapes.
 * Used by adapter ports (`PdfJsRuntime` returns `PdfDocument`) and runtime/plugins.
 * Neither adapter nor runtime depends on the other — both depend on model.
 */

export type {
  CanvasSurface,
  PdfDocument,
  PdfPage,
  PdfTextContentItem,
  PdfViewport,
} from "./document";
