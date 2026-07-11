/**
 * Public type surface for `@gopdfjs/engine` npm consumers.
 * Relative imports so post-build d.ts rollup inlines all types (no private @gopdfjs/* in tarball).
 */
export type { CompressionLevel } from "../../adapter/src/engine";

export type {
  Gopdf,
  PdfJpegPage,
  PdfToJpegOptions,
  PdfToTextFormat,
  PdfToTextOptions,
} from "../../adapter/src/gopdf";

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
} from "../../plugin/src/index";
