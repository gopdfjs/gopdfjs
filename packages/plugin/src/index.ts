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
  GrayscaleMode,
  GrayscalePdfOptions,
  GrayscalePdfResult,
  HtmlToPdfMargin,
  HtmlToPdfOptions,
  HtmlToPdfOrientation,
  HtmlToPdfPageSize,
  HtmlToPdfResult,
  ImageInput,
  PdfAnalysisMeta,
  PdfAnalysisResult,
  PdfTextRun,
  RedactPdfOptions,
  RedactRegion,
  RepairPdfOptions,
  RepairPdfResult,
  SignPlacement,
  WatermarkImage,
  WatermarkPosition,
} from "./domain";
