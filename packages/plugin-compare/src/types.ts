export type {
  ComparePdfTextOptions,
  CompareSession,
  PagePairRender,
  PdfRect,
  TextChangeItem,
  TextDiffResult,
  VisualDiffResult,
} from "@gopdfjs/plugin/domain";

/** Internal — word geometry for text diff mapping. */
export type PositionedWord = {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pageIndex: number;
  charOffset: number;
};
