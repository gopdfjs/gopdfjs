export * from "./pdfTypes";
export * from "./constants";
export type {
  ComparePdfTextOptions,
  CompareSession,
  PagePairRender,
  PdfRect,
  TextChangeItem,
  TextDiffResult,
  VisualDiffResult,
} from "./types";
export { comparePdfText, createCompareSession } from "./comparePdf";
export {
    computeCompareRenderScale,
    getPageBoxPt,
    mergePageBoxes,
    releaseCanvas,
    renderPageIntoBox,
    cloneCanvas,
} from "./renderPage";
export type { PageBoxPt } from "./renderPage";
export { visualDiffCanvas } from "./visualDiff";
export {
    extractDocumentWords,
    extractPageWords,
    wordsToPlainText,
    buildWordStartOffsets,
} from "./extractText";
export { diffPdfText, findWordsByOffsetRange, mergeLineRects } from "./textDiff";
export { ComparePageCache } from "./pageCache";
