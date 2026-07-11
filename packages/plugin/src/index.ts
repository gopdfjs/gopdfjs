/**
 * @gopdfjs/plugin — plugin domain contracts (options/results shared with `Gopdf`).
 *
 * Feature packages import this for tool-specific option/result types.
 * For `GopdfRuntime`, import `@gopdfjs/runtime` instead.
 */

export type {
  Annotation,
  AnnotationImage,
  BatchPdfInput,
  BatchRepairResult,
  ComparePdfTextOptions,
  CompareSession,
  GrayscaleMode,
  GrayscalePdfOptions,
  GrayscalePdfResult,
  HtmlToPdfMargin,
  HtmlToPdfOptions,
  HtmlToPdfOrientation,
  HtmlToPdfPageSize,
  HtmlToPdfResult,
  ImageInput,
  PagePairRender,
  PdfAnalysisMeta,
  PdfAnalysisResult,
  PdfRect,
  PdfTextRun,
  RedactPdfOptions,
  RedactRegion,
  RepairPdfOptions,
  RepairPdfResult,
  SignPlacement,
  TextChangeItem,
  TextDiffResult,
  VisualDiffResult,
  WatermarkImage,
  WatermarkPosition,
} from "./domain";
