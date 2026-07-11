/**
 * Consumer-facing `@gopdfjs/engine` entry.
 *
 * Import **`Gopdf` methods** and **`createEngine`** here only.
 *
 * Adapter authors: `@gopdfjs/adapter` · `@gopdfjs/adapter-browser` / `@gopdfjs/adapter-node`
 */

export type { CompressionLevel } from "@gopdfjs/adapter/engine";

export type {
  Gopdf,
  PdfJpegPage,
  PdfToJpegOptions,
  PdfToTextFormat,
  PdfToTextOptions,
} from "@gopdfjs/adapter/gopdf";

export type {
  Annotation,
  ComparePdfTextOptions,
  CompareSession,
  GrayscalePdfOptions,
  GrayscalePdfResult,
  HtmlToPdfOptions,
  HtmlToPdfResult,
  PagePairRender,
  PdfAnalysisResult,
  PdfRect,
  RedactRegion,
  TextChangeItem,
  TextDiffResult,
  VisualDiffResult,
} from "@gopdfjs/plugin";

export { createEngine } from "./createEngine";
